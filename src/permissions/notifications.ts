import { PushNotifications } from "@capacitor/push-notifications";
 
export async function requestNotificationPermission() {
  try {
    const permStatus = await PushNotifications.checkPermissions();
 
    if (permStatus.receive !== "granted") {
      const request = await PushNotifications.requestPermissions();
 
      if (request.receive !== "granted") {
        console.warn("❌ Permission de notification refusée");
        return false;
      }
    }
 
    console.log("✅ Permission de notification accordée");
    return true;
 
  } catch (error) {
    console.error("Erreur lors de la demande de permission :", error);
    return false;
  }
}
 