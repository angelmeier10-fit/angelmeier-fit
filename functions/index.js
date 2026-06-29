const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Región más cercana a Argentina
setGlobalOptions({ region: "us-east1" });

/**
 * Webhook de MercadoPago.
 * MP llama a esta URL cuando ocurre un evento de pago.
 * URL: https://us-east1-angelmeier-fit.cloudfunctions.net/mpWebhook
 */
exports.mpWebhook = onRequest(async (req, res) => {
  // MP hace GET para validar la URL al configurar el webhook
  if (req.method === "GET") {
    return res.status(200).send("OK");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const body = req.body;

    // MP envía topic=payment cuando es un pago
    const topic = body.topic || body.type;
    const paymentId = body.data?.id || body.id;

    if (topic !== "payment" || !paymentId) {
      return res.status(200).send("Ignored");
    }

    // Access Token configurado con:
    // firebase functions:secrets:set MP_ACCESS_TOKEN
    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!MP_ACCESS_TOKEN) {
      console.error("MP_ACCESS_TOKEN no configurado");
      return res.status(500).send("Config missing");
    }

    // Verificar el pago con la API de MercadoPago
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
    );

    if (!mpRes.ok) {
      console.error("Error consultando MP:", mpRes.status);
      return res.status(200).send("MP API error");
    }

    const payment = await mpRes.json();

    // Solo procesar pagos aprobados
    if (payment.status !== "approved") {
      console.log(`Pago ${paymentId} no aprobado: ${payment.status}`);
      return res.status(200).send("Not approved");
    }

    // El plan ID viene en external_reference del pago.
    // Se setea al crear la preferencia de Checkout Pro.
    const planId = payment.external_reference;
    const payerEmail = payment.payer?.email;
    const payerName =
      `${payment.payer?.first_name || ""} ${payment.payer?.last_name || ""}`.trim() ||
      payerEmail ||
      "Sin nombre";

    if (!planId) {
      console.error("No hay external_reference en el pago");
      return res.status(200).send("No planId");
    }

    // Buscar el plan en Firestore
    const planRef = db.collection("planes").doc(planId);
    const planSnap = await planRef.get();

    if (!planSnap.exists) {
      console.error(`Plan ${planId} no encontrado`);
      return res.status(200).send("Plan not found");
    }

    const plan = planSnap.data();
    const members = plan.members || [];

    // Verificar si el miembro ya existe (por email) para renovar en vez de duplicar
    const existingIdx = payerEmail
      ? members.findIndex((m) => m.email === payerEmail)
      : -1;

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + (plan.durationDays || 30));
    const expiry = expDate.toISOString().split("T")[0];

    if (existingIdx >= 0) {
      // Renovar miembro existente
      members[existingIdx].status = "active";
      members[existingIdx].expiry = expiry;
      members[existingIdx].lastPaymentId = String(paymentId);
      console.log(`Miembro renovado: ${payerEmail} en plan ${planId}`);
    } else {
      // Agregar nuevo miembro
      const newMember = {
        id: "m" + Date.now(),
        name: payerName,
        email: payerEmail || "",
        status: "active",
        expiry,
        addedAt: new Date().toLocaleDateString("es-AR"),
        lastPaymentId: String(paymentId),
        autoActivated: true,
      };
      members.push(newMember);
      console.log(`Nuevo miembro: ${payerName} (${payerEmail}) en plan ${planId}`);
    }

    await planRef.update({ members });

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Error en mpWebhook:", err);
    return res.status(500).send("Internal error");
  }
});

/**
 * Crea una preferencia de Checkout Pro para un plan.
 * El frontend llama a esta función para obtener el link de pago con planId embebido.
 * URL: https://us-east1-angelmeier-fit.cloudfunctions.net/crearPago
 */
exports.crearPago = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ error: "planId requerido" });

    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!MP_ACCESS_TOKEN) {
      return res.status(500).json({ error: "Config missing" });
    }

    const planSnap = await db.collection("planes").doc(planId).get();
    if (!planSnap.exists) return res.status(404).json({ error: "Plan no encontrado" });

    const plan = planSnap.data();

    const preference = {
      items: [
        {
          title: plan.name,
          description: plan.desc || plan.name,
          quantity: 1,
          currency_id: "ARS",
          unit_price: Number(plan.price) || 1,
        },
      ],
      // external_reference vincula el pago al plan para que el webhook lo identifique
      external_reference: planId,
      back_urls: {
        success: `https://angelmeier-fit.web.app/?plan=${planId}&pago=ok`,
        failure: `https://angelmeier-fit.web.app/?plan=${planId}&pago=error`,
        pending: `https://angelmeier-fit.web.app/?plan=${planId}&pago=pendiente`,
      },
      auto_return: "approved",
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!mpRes.ok) {
      const err = await mpRes.text();
      console.error("Error creando preferencia MP:", err);
      return res.status(500).json({ error: "Error MP API" });
    }

    const data = await mpRes.json();
    return res.status(200).json({ initPoint: data.init_point });
  } catch (err) {
    console.error("Error en crearPago:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});
