self.addEventListener("install", () => {
  console.log("Service Worker installed");
});

self.addEventListener("fetch", () => {});

// 🔔 ADD THIS: PUSH EVENT HANDLER
self.addEventListener("push", (event) => {
  let data = {
    title: "Notification",
    body: "You have a new update",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/images.png",
    })
  );
});
