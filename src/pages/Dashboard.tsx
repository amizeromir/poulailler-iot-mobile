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

import { Haptics, ImpactStyle } from "@capacitor/haptics";  // <<< VIBRATION ICI
import API_URL from "../api/config";


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

  // 🔄 Charger données capteurs
  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/sensors/latest`);
      const json = await response.json();

      const formatted = json.map((item: any) => ({
        temperature: item.temperature?.value || 0,
        humidity: item.humidity?.value || 0,
        ammonia: item.ammonia?.value || 0,
        luminosity: item.luminosity?.value || 0,
        timestamp: new Date(item.timestamp).toLocaleString(),
      }));

      setData(formatted.reverse());

      const latest = formatted[formatted.length - 1];
      checkAlerts(latest);
    } catch (error) {
      console.error("Erreur récupération capteurs :", error);
    } finally {
      setLoading(false);
    }
  };

  // ⚠️ Vérification dynamique + vibration
  const checkAlerts = async (latest: SensorData) => {
    if (!latest) return;

    const vibrate = async () =>
      await Haptics.impact({ style: ImpactStyle.Heavy });

    if (latest.ammonia > 25) {
      setAlertMessage("⚠️ Niveau d’ammoniac trop élevé !");
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const toggleDevice = (device: string) => {
    if (device === "fan") setFanOn(!fanOn);
    if (device === "lamp") setLampOn(!lampOn);
    if (device === "water") setWaterOn(!waterOn);
  };

  useEffect(() => {
    fetchData();
    fetchAlerts();

    const interval = setInterval(() => {
      fetchData();
      fetchAlerts();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const latest = data[data.length - 1] || {};

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
                      <h2>{latest.temperature} °C</h2>
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
                      <h2>{latest.humidity} %</h2>
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
                      <h2>{latest.ammonia} ppm</h2>
                      {latest.ammonia > 25 && (
                        <IonChip color="danger">☠️ Niveau dangereux</IonChip>
                      )}
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6">
                  <IonCard>
                    <IonCardHeader>
                      <IonCardTitle>💡 Luminosité</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <h2>{latest.luminosity} lx</h2>
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
                          <td>{item.temperature}</td>
                          <td>{item.humidity}</td>
                          <td>{item.ammonia}</td>
                          <td>{item.luminosity}</td>
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
