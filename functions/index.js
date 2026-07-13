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

    // El plan ID (o "sub:"+uid para suscripciones individuales) viene en
    // external_reference del pago. Se setea al crear la preferencia de Checkout Pro.
    const externalRef = payment.external_reference;
    const payerEmail = payment.payer?.email;
    const payerName =
      `${payment.payer?.first_name || ""} ${payment.payer?.last_name || ""}`.trim() ||
      payerEmail ||
      "Sin nombre";

    if (!externalRef) {
      console.error("No hay external_reference en el pago");
      return res.status(200).send("No external_reference");
    }

    if (externalRef.startsWith("sub:")) {
      // Suscripción individual: actualiza subscribers/{uid} en vez de planes/{id}.members
      const uid = externalRef.slice(4);
      const subRef = db.collection("subscribers").doc(uid);
      const subSnap = await subRef.get();

      if (!subSnap.exists) {
        console.error(`Subscriber ${uid} no encontrado`);
        return res.status(200).send("Subscriber not found");
      }

      const categoria = subSnap.data().categoria;
      let planId = null;
      if (categoria && categoria !== "global") {
        const fijoSnap = await db.collection("planesFijos").doc(categoria).get();
        planId = fijoSnap.exists ? fijoSnap.data().planId || null : null;
      }

      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 30);
      const expiry = expDate.toISOString().split("T")[0];

      const updates = {
        status: "active",
        expiry,
        lastPaymentId: String(paymentId),
        planId,
      };
      // startDate/startWeek solo se setean en la primera activación: renovaciones
      // no deben reiniciar la semana del plan en la que ya venía el alumno.
      if (!subSnap.data().startDate) {
        updates.startDate = new Date().toISOString().split("T")[0];
        updates.startWeek = 1;
      }

      await subRef.update(updates);
      console.log(`Suscripción activada: ${uid} (${categoria}) hasta ${expiry}`);

      return res.status(200).send("OK");
    }

    const planId = externalRef;

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
    const { planId, subscriberId } = req.body;
    if (!planId && !subscriberId) {
      return res.status(400).json({ error: "planId o subscriberId requerido" });
    }

    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!MP_ACCESS_TOKEN) {
      return res.status(500).json({ error: "Config missing" });
    }

    let preference;

    if (subscriberId) {
      // Suscripción individual: precio sale del plan fijo mapeado a la
      // categoría del alumno (planesFijos/{categoria}.planId -> planes/{id}.price),
      // salvo "global" que no tiene un único plan y usa planesFijos/global.price.
      const subSnap = await db.collection("subscribers").doc(subscriberId).get();
      if (!subSnap.exists) return res.status(404).json({ error: "Suscriptor no encontrado" });

      const categoria = subSnap.data().categoria;
      if (!categoria) return res.status(400).json({ error: "El suscriptor no tiene categoría elegida" });

      const fijoSnap = await db.collection("planesFijos").doc(categoria).get();
      if (!fijoSnap.exists) return res.status(404).json({ error: `planesFijos/${categoria} no configurado` });

      const fijo = fijoSnap.data();
      let price;
      let title = `Suscripción ${categoria}`;

      if (categoria === "global") {
        price = Number(fijo.price) || 0;
      } else {
        if (!fijo.planId) return res.status(404).json({ error: `planesFijos/${categoria} sin planId` });
        const planSnap = await db.collection("planes").doc(fijo.planId).get();
        if (!planSnap.exists) return res.status(404).json({ error: "Plan fijo no encontrado" });
        const plan = planSnap.data();
        price = Number(plan.price) || 0;
        title = plan.name || title;
      }

      if (!price) return res.status(400).json({ error: "El plan fijo no tiene precio configurado" });

      preference = {
        items: [
          {
            title,
            description: title,
            quantity: 1,
            currency_id: "ARS",
            unit_price: price,
          },
        ],
        // external_reference con prefijo "sub:" para que el webhook lo distinga
        // del flujo de planes grupales y actualice subscribers/{uid}.
        external_reference: `sub:${subscriberId}`,
        back_urls: {
          success: `https://angelmeier-fit.web.app/?alumno=1&pago=ok`,
          failure: `https://angelmeier-fit.web.app/?alumno=1&pago=error`,
          pending: `https://angelmeier-fit.web.app/?alumno=1&pago=pendiente`,
        },
        auto_return: "approved",
      };
    } else {
      const planSnap = await db.collection("planes").doc(planId).get();
      if (!planSnap.exists) return res.status(404).json({ error: "Plan no encontrado" });

      const plan = planSnap.data();

      preference = {
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
    }

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
