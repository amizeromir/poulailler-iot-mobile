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
import API_URL from "../api/config";

interface SensorData {
  temperature: number;
  humidity: number;
  ammonia: number;
  luminosity: number;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  // États pour les équipements
  const [fanOn, setFanOn] = useState(false);
  const [lampOn, setLampOn] = useState(false);
  const [waterOn, setWaterOn] = useState(false);

  // 🔄 Charger les données capteurs
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
      checkAlerts(formatted[formatted.length - 1]);
    } catch (error) {
      console.error("Erreur récupération capteurs :", error);
    } finally {
      setLoading(false);
    }
  };

  // ⚠️ Vérification dynamique des seuils
  const checkAlerts = (latest: SensorData) => {
    if (!latest) return;

    if (latest.ammonia > 25) {
      setAlertMessage("⚠️ Niveau d’ammoniac trop élevé !");
      setShowAlert(true);
    } else if (latest.temperature > 35) {
      setAlertMessage("🔥 Température trop élevée !");
      setShowAlert(true);
    } else if (latest.humidity < 30) {
      setAlertMessage("💧 Humidité trop faible !");
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  };

  // 🚪 Déconnexion
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // 🧠 Contrôle des équipements (placeholder — futur lien avec ESP32)
  const toggleDevice = (device: string) => {
    switch (device) {
      case "fan":
        setFanOn(!fanOn);
        break;
      case "lamp":
        setLampOn(!lampOn);
        break;
      case "water":
        setWaterOn(!waterOn);
        break;
    }

    // 🚀 FUTUR : envoyer un signal MQTT ou HTTP à l’ESP32
    console.log(`Action envoyée à ${device}`);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
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
            {/* ⚠️ Alertes dynamiques */}
            {showAlert && (
              <IonAlert
                isOpen={showAlert}
                header="Alerte environnementale"
                message={alertMessage}
                buttons={["OK"]}
                onDidDismiss={() => setShowAlert(false)}
              />
            )}

            {/* 🔘 Boutons de contrôle */}
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

            {/* 📊 Données récentes */}
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

            {/* 📈 Graphique */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Évolution des mesures</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data}>
                    <Line type="monotone" dataKey="temperature" stroke="#ff7300" name="Température" />
                    <Line type="monotone" dataKey="humidity" stroke="#007bff" name="Humidité" />
                    <CartesianGrid stroke="#ccc" />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis />
                    <Tooltip />
                  </LineChart>
                </ResponsiveContainer>
              </IonCardContent>
            </IonCard>

            {/* 📋 Historique */}
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
