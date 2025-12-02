// Dashboard.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonAlert,
  IonChip,
  IonList,
  IonItem,
  IonLabel,
} from "@ionic/react";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Haptics, ImpactStyle } from "@capacitor/haptics";
import API_URL from "../api/config"; // Assurez-vous que cette importation est correcte

// --- INTERFACES ---
interface SensorData {
  temperature: number; 
  humidity: number;
  ammonia: number;
  luminosity: number;
  timestamp: string;
}

interface AlertData {
  type: string;
  message: string;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const [fanOn, setFanOn] = useState(false);
  const [lampOn, setLampOn] = useState(false);
  const [waterOn, setWaterOn] = useState(false);

  // Helper 1: Sécurise l'appel à toFixed() contre les valeurs non numériques (null/undefined/NaN)
  const safeToFixed = (value: any, digits: number): string => {
    const num = Number(value);
    // Vérifie si la valeur est un nombre et n'est pas NaN
    if (typeof num === 'number' && !isNaN(num) && value !== null && value !== undefined) {
      return num.toFixed(digits);
    }
    return 'N/A';
  };

  // Helper 2: Gère les structures de données incohérentes de l'API (directe OU objet avec .value)
  const getSensorValue = (item: any, key: string): number => {
      const prop = item[key];
      // Si la propriété est un objet et a une clé 'value', on prend .value
      if (typeof prop === 'object' && prop !== null && 'value' in prop) {
          return Number(prop.value) || 0;
      }
      // Sinon, on prend la propriété directement (si elle est numérique)
      return Number(prop) || 0;
  };

  // 🔄 Charger données capteurs
  const fetchData = async () => {
    try {
      // La route /latest est censée renvoyer le document le plus récent à l'index [0]
      const response = await fetch(`${API_URL}/sensors/latest`);
      
      if (response.status === 500) {
        throw new Error("Erreur 500: Erreur interne du serveur API.");
      }
      
      const json = await response.json();

      const formatted = json.map((item: any) => ({
        temperature: getSensorValue(item, 'temperature'),
        humidity: getSensorValue(item, 'humidity'),
        ammonia: getSensorValue(item, 'ammonia'),
        luminosity: getSensorValue(item, 'luminosity'),
        timestamp: new Date(item.timestamp).toLocaleString(),
      }));

      // Stocke le tableau pour le graphique. Le plus récent est à l'index [0]
      setData(formatted); 

      // La dernière lecture est la première entrée du tableau
      const latest = formatted[0];
      checkAlerts(latest);
    } catch (error) {
      console.error("Erreur récupération capteurs :", error);
      setAlertMessage(`Erreur de connexion : ${error instanceof Error ? error.message : "Erreur inconnue."}`);
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // ⚠️ Vérification dynamique + vibration
  const checkAlerts = async (latest: SensorData) => {
    // S'assurer que latest existe et que les valeurs sont réelles
    if (!latest || latest.temperature === 0 || latest.humidity === 0 || latest.ammonia === 0) return;

    const vibrate = async () =>
      await Haptics.impact({ style: ImpactStyle.Heavy });

    if (latest.ammonia > 25) {
      setAlertMessage("⚠️ Niveau d'ammoniac trop élevé !");
      setShowAlert(true);
      vibrate();
    } else if (latest.temperature > 35) {
      setAlertMessage("🔥 Température trop élevée !");
      setShowAlert(true);
      vibrate();
    } else if (latest.humidity < 30) {
      setAlertMessage("💧 Humidité trop faible !");
      setShowAlert(true);
      vibrate();
    } else {
      setShowAlert(false);
    }
  };

  // 🚨 Charger liste des alertes (backend)
  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_URL}/alerts`);
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      console.error("Erreur récupération alertes:", err);
    }
  };

  // 🎮 Contrôler l'ESP32
  const controlESP32 = async (component: string, action: string) => {
    try {
      let mqttCommand = "";
      if (component === "fan" && action === "on") mqttCommand = "fan_on";
      else if (component === "fan" && action === "off") mqttCommand = "fan_off";
      else if (component === "lamp" && action === "on") mqttCommand = "light_on";
      else if (component === "lamp" && action === "off") mqttCommand = "light_off";
      else if (component === "water" && action === "on") mqttCommand = "water_on";
      else if (component === "water" && action === "off") mqttCommand = "water_off";

      console.log(`🎮 Envoi commande: ${mqttCommand}`);

      const response = await fetch(`${API_URL}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device: "device1",
          command: mqttCommand
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur backend: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Commande envoyée avec succès:', result);
      
      await Haptics.impact({ style: ImpactStyle.Light });
      
    } catch (error) {
      console.error('❌ Erreur envoi commande:', error);
      setAlertMessage("Erreur: Impossible d'envoyer la commande au poulailler");
      setShowAlert(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // 🎯 Toggle
  const toggleDevice = (device: string) => {
    if (device === "fan") {
      const newState = !fanOn;
      setFanOn(newState);
      controlESP32("fan", newState ? "on" : "off");
    }
    if (device === "lamp") {
      const newState = !lampOn;
      setLampOn(newState);
      controlESP32("lamp", newState ? "on" : "off");
    }
    if (device === "water") {
      const newState = !waterOn;
      setWaterOn(newState);
      // controlESP32("water", newState ? "on" : "off");
    }
  };

  // --- HOOK DE MONTAGE ET INTERVALLE ---
  useEffect(() => {
    fetchData();
    fetchAlerts();

    const interval = setInterval(() => {
      fetchData();
      fetchAlerts();
    }, 10000); 

    return () => clearInterval(interval);
  }, []);

  // La dernière donnée est à l'index 0 (si la requête API est correcte)
  const latest = data[0] || {};

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>🐔 Dashboard Poulailler</IonTitle>
          <IonButton slot="end" color="danger" onClick={handleLogout}>
            Déconnexion
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading ? (
          <div className="ion-text-center">
            <IonSpinner name="crescent" />
            <p>Chargement des données...</p>
          </div>
        ) : (
          <>
            {/* ALERTE AVEC VIBRATION */}
            {showAlert && (
              <IonAlert
                isOpen={showAlert}
                header="Alerte environnementale"
                message={alertMessage}
                buttons={["OK"]}
                onDidDismiss={() => setShowAlert(false)}
              />
            )}

            {/* CONTROLE DES EQUIPEMENTS */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>⚙️ Contrôle des équipements</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol>
                      <IonButton
                        expand="block"
                        color={fanOn ? "success" : "medium"}
                        onClick={() => toggleDevice("fan")}
                      >
                        {fanOn ? "🌀 Ventilateur ON" : "🌀 Ventilateur OFF"}
                      </IonButton>
                    </IonCol>
                    <IonCol>
                      <IonButton
                        expand="block"
                        color={lampOn ? "warning" : "medium"}
                        onClick={() => toggleDevice("lamp")}
                      >
                        {lampOn ? "💡 Lampe ON" : "💡 Lampe OFF"}
                      </IonButton>
                    </IonCol>
                    <IonCol>
                      <IonButton
                        expand="block"
                        color={waterOn ? "tertiary" : "medium"}
                        onClick={() => toggleDevice("water")}
                      >
                        {waterOn ? "🚰 Abreuvoir ON" : "🚰 Abreuvoir OFF"}
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>

            {/* DONNEES RECENTES */}
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>🌡️ Température</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <h2>{safeToFixed(latest.temperature, 1)} °C</h2> 
                      {latest.temperature > 35 && (
                        <IonChip color="danger">🔥 Trop chaud</IonChip>
                      )}
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6">
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>💧 Humidité</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <h2>{safeToFixed(latest.humidity, 1)} %</h2>
                      {latest.humidity < 30 && (
                        <IonChip color="warning">⚠️ Faible humidité</IonChip>
                      )}
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="6">
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>☁️ Ammoniac (NH₃)</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <h2>{safeToFixed(latest.ammonia, 0)} ppm</h2>
                      {latest.ammonia > 25 && (
                        <IonChip color="danger">☠️ Niveau dangereux</IonChip>
                      )}
                    </IonCardContent>
                  </IonCard>
                </IonCol> {/* <-- FERMETURE CORRECTE DE LA BALISE IONIC */}

                <IonCol size="6">
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>💡 Luminosité</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <h2>{safeToFixed(latest.luminosity, 0)} lx</h2>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>

            {/* GRAPHIQUE */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Évolution des mesures</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data}>
                    <Line type="monotone" dataKey="temperature" stroke="#ff7300" />
                    <Line type="monotone" dataKey="humidity" stroke="#007bff" />
                    <CartesianGrid stroke="#ccc" />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis />
                    <Tooltip />
                  </LineChart>
                </ResponsiveContainer>
              </IonCardContent>
            </IonCard>

            {/* LISTE DES ALERTES */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>📢 Alertes récentes</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  {alerts.length === 0 ? (
                    <IonItem><IonLabel>Aucune alerte.</IonLabel></IonItem>
                  ) : (
                    alerts.map((a, i) => (
                      <IonItem key={i} color="danger">
                        <IonLabel>
                          <h2>{a.type}</h2>
                          <p>{a.message}</p>
                          <small>{new Date(a.timestamp).toLocaleString()}</small>
                        </IonLabel>
                      </IonItem>
                    ))
                  )}
                </IonList>
              </IonCardContent>
            </IonCard>

            {/* HISTORIQUE */}
            <IonCard>
              <IonCardHeader>
                {/* CORRECTION DE LA FAUTE DE FRAPPE IonFName -> IonCardTitle */}
                <IonCardTitle>Historique des mesures</IonCardTitle> 
              </IonCardHeader>
              <IonCardContent>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f0f0f0" }}>
                        <th>Date</th>
                        <th>Temp (°C)</th>
                        <th>Humidité (%)</th>
                        <th>NH₃ (ppm)</th>
                        <th>Luminosité (lx)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, index) => (
                        <tr key={index}>
                          <td>{item.timestamp}</td>
                          <td>{safeToFixed(item.temperature, 1)}</td>
                          <td>{safeToFixed(item.humidity, 1)}</td>
                          <td>{safeToFixed(item.ammonia, 0)}</td>
                          <td>{safeToFixed(item.luminosity, 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </IonCardContent>
            </IonCard>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;