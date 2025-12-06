// Dashboard.tsx - VERSION CORRIGÉE
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
  IonCardSubtitle,
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
  IonIcon,
  IonBadge,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { 
  thermometerOutline, 
  waterOutline, 
  warningOutline, 
  sunnyOutline,
  flashOutline,
  bulbOutline,
  refreshOutline,
  logOutOutline,
  statsChartOutline,
  listOutline
} from "ionicons/icons";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { Haptics, ImpactStyle } from "@capacitor/haptics";
import API_URL from "../api/config";

// --- INTERFACES ---
interface SensorData {
  _id: string;
  deviceId: string;
  originalDevice: string;
  capteurNum: number;
  temperature: number;
  humidity: number;
  ammonia: number;
  luminosity: number;
  timestamp: string;
  lastUpdated: string;
}

interface AlertData {
  _id: string;
  deviceId: string;
  type: string;
  message: string;
  value: number;
  timestamp: string;
  resolved: boolean;
}

interface ControlState {
  fan: boolean;
  lamp: boolean;
  water: boolean;
}

// --- STYLES CSS INTÉGRÉS ---
const dashboardStyles = `
/* Dashboard Styles */
.dashboard-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.sensor-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.sensor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.sensor-value {
  text-align: center;
  padding: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,249,252,0.9) 100%);
  margin: 8px 0;
  border: 1px solid rgba(0,0,0,0.05);
}

.sensor-value h2 {
  margin: 12px 0 6px 0;
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
}

.sensor-value p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.sensor-value ion-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Temperature status */
.temp-high {
  background: linear-gradient(135deg, #ff9966, #ff5e62) !important;
  color: white !important;
}

.temp-high ion-card-title,
.temp-high ion-card-subtitle {
  color: white !important;
}

.temp-normal {
  background: linear-gradient(135deg, #36d1dc, #5b86e5) !important;
  color: white !important;
}

.temp-low {
  background: linear-gradient(135deg, #00b09b, #96c93d) !important;
  color: white !important;
}

/* Control buttons */
.control-button {
  --border-radius: 12px;
  --padding-top: 18px;
  --padding-bottom: 18px;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.5px;
}

.control-button-on {
  --background: linear-gradient(135deg, #2dd36f 0%, #28ba62 100%);
  --background-activated: #28ba62;
}

.control-button-off {
  --background: linear-gradient(135deg, #92949c 0%, #7a7c85 100%);
  --background-activated: #7a7c85;
}

/* Alert card */
.alert-card {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
  color: white;
  border-radius: 16px;
  margin: 16px 0;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(255, 107, 107, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0); }
}

/* Chart styling */
.chart-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin: 16px 0;
}

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin: 20px 0;
}

.stat-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.03);
}

.stat-item h3 {
  margin: 0 0 8px 0;
  font-size: 1.8rem;
  color: #2c3e50;
  font-weight: 700;
}

.stat-item p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Segment styling */
.custom-segment {
  --background: #f8f9fa;
  border-radius: 12px;
  margin: 16px 0;
  padding: 4px;
}

.custom-segment ion-segment-button {
  --border-radius: 10px;
  --color: #7f8c8d;
  --color-checked: white;
  --indicator-color: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-weight: 600;
}

/* Loading spinner */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
}

.loading-text {
  margin-top: 20px;
  color: #667eea;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .sensor-value h2 {
    font-size: 1.7rem;
  }
  
  .control-button {
    --padding-top: 14px;
    --padding-bottom: 14px;
    font-size: 0.9rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .sensor-value h2 {
    font-size: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
`;

// Fonction pour injecter le CSS
const injectStyles = () => {
  const styleElement = document.createElement('style');
  styleElement.textContent = dashboardStyles;
  document.head.appendChild(styleElement);
  return () => styleElement.remove();
};

const Dashboard: React.FC = () => {
  // Injecter le CSS au montage
  useEffect(() => {
    const cleanup = injectStyles();
    return cleanup;
  }, []);

  // États principaux
  const [allSensors, setAllSensors] = useState<SensorData[]>([]);
  const [activeSensors, setActiveSensors] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Contrôle des actionneurs
  const [controls, setControls] = useState<ControlState>({
    fan: false,
    lamp: false,
    water: false
  });

  // Helper: Formatage sécurisé des nombres
  const safeToFixed = (value: any, digits: number): string => {
    const num = Number(value);
    if (typeof num === 'number' && !isNaN(num) && value !== null && value !== undefined) {
      return num.toFixed(digits);
    }
    return '--';
  };

  // ================================
  // 🔄 CHARGER LES 3 CAPTEURS - VERSION CORRIGÉE
  // ================================
  const fetchAllSensors = async () => {
    try {
      setLoading(true);
      
      // ✅ UTILISER LA ROUTE QUI EXISTE : /api/sensors/three-sensors
      const response = await fetch(`${API_URL}/sensors/three-sensors`);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.capteurs) {
        const formatted = result.capteurs.map((sensor: any) => ({
          _id: sensor.id || `sensor-${Date.now()}`,
          deviceId: sensor.deviceId,
          originalDevice: "device1",
          capteurNum: sensor.capteurNum,
          temperature: sensor.temperature || 0,
          humidity: sensor.humidity || 0,
          ammonia: sensor.ammonia || 0,
          luminosity: sensor.luminosity || 0,
          timestamp: sensor.timestamp ? new Date(sensor.timestamp).toLocaleString() : new Date().toLocaleString(),
          lastUpdated: sensor.lastUpdated ? new Date(sensor.lastUpdated).toLocaleTimeString() : new Date().toLocaleTimeString()
        }));
        
        setAllSensors(formatted);
        setActiveSensors(formatted);
        setLastUpdate(new Date().toLocaleTimeString());
        
        // Vérifier les alertes
        checkAllAlerts(formatted);
      }
    } catch (error) {
      console.error("❌ Erreur récupération capteurs :", error);
      
      // ✅ DONNÉES MOCKÉES SI L'API ÉCHOUE
      const mockSensors = [
        {
          _id: "capteur1-mock",
          deviceId: "device1-capteur1",
          originalDevice: "device1",
          capteurNum: 1,
          temperature: 23.2,
          humidity: 55.0,
          ammonia: 0,
          luminosity: 0,
          timestamp: new Date().toLocaleString(),
          lastUpdated: new Date().toLocaleTimeString()
        },
        {
          _id: "capteur2-mock",
          deviceId: "device1-capteur2",
          originalDevice: "device1",
          capteurNum: 2,
          temperature: 23.5,
          humidity: 52.0,
          ammonia: 0,
          luminosity: 0,
          timestamp: new Date().toLocaleString(),
          lastUpdated: new Date().toLocaleTimeString()
        },
        {
          _id: "capteur3-mock",
          deviceId: "device1-capteur3",
          originalDevice: "device1",
          capteurNum: 3,
          temperature: 20.4,
          humidity: 56.0,
          ammonia: 0,
          luminosity: 0,
          timestamp: new Date().toLocaleString(),
          lastUpdated: new Date().toLocaleTimeString()
        }
      ];
      
      setAllSensors(mockSensors);
      setActiveSensors(mockSensors);
      setLastUpdate(new Date().toLocaleTimeString());
      
      setAlertMessage("Mode démo: Données de test");
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // ⚠️ Vérification des alertes pour TOUS les capteurs
  const checkAllAlerts = async (sensors: SensorData[]) => {
    const vibrate = async () => await Haptics.impact({ style: ImpactStyle.Medium });
    
    let hasAlert = false;
    let alertMsg = "";
    
    sensors.forEach(sensor => {
      if (sensor.ammonia > 25) {
        alertMsg = `⚠️ Capteur ${sensor.capteurNum}: Ammoniac élevé (${sensor.ammonia} ppm)`;
        hasAlert = true;
      } else if (sensor.temperature > 35) {
        alertMsg = `🔥 Capteur ${sensor.capteurNum}: Température élevée (${sensor.temperature}°C)`;
        hasAlert = true;
      } else if (sensor.humidity < 30) {
        alertMsg = `💧 Capteur ${sensor.capteurNum}: Humidité faible (${sensor.humidity}%)`;
        hasAlert = true;
      }
    });
    
    if (hasAlert) {
      setAlertMessage(alertMsg);
      setShowAlert(true);
      await vibrate();
    }
  };

  // 🚨 Charger les alertes
  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/alerts`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const recentAlerts = result.data
            .filter((alert: AlertData) => !alert.resolved)
            .slice(0, 5);
          setAlerts(recentAlerts);
        }
      }
    } catch (error) {
      console.error("❌ Erreur récupération alertes:", error);
    }
  };

  // 🎮 Contrôler les actionneurs
  const controlESP32 = async (component: keyof ControlState, action: 'on' | 'off') => {
    try {
      const commands: {[key: string]: string} = {
        'fan_on': 'fan_on',
        'fan_off': 'fan_off',
        'lamp_on': 'light_on',
        'lamp_off': 'light_off',
        'water_on': 'water_on',
        'water_off': 'water_off'
      };

      const commandKey = `${component}_${action}`;
      const mqttCommand = commands[commandKey];

      if (!mqttCommand) {
        throw new Error('Commande inconnue');
      }

      const response = await fetch(`${API_URL}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device: "device1",
          command: mqttCommand
        }),
      });

      if (!response.ok) throw new Error(`Erreur backend: ${response.status}`);

      setControls(prev => ({
        ...prev,
        [component]: action === 'on'
      }));

      await Haptics.impact({ style: ImpactStyle.Light });
      
    } catch (error) {
      console.error('❌ Erreur envoi commande:', error);
      setAlertMessage("Erreur: Impossible d'envoyer la commande");
      setShowAlert(true);
    }
  };

  // 🔄 Rafraîchir manuellement
  const handleRefresh = async () => {
    await fetchAllSensors();
    await fetchAlerts();
    await Haptics.impact({ style: ImpactStyle.Light });
  };

  // 🚪 Déconnexion
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // 📊 Préparer les données pour les graphiques
  const prepareChartData = () => {
    if (allSensors.length === 0) return [];
    
    const recentData = [...allSensors]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .reverse();
    
    return recentData.map(item => ({
      time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: item.temperature,
      hum: item.humidity,
      sensor: `Capteur ${item.capteurNum}`
    }));
  };

  // 🎯 Calculer les moyennes
  const calculateAverages = () => {
    if (activeSensors.length === 0) return { temp: 0, hum: 0, amm: 0 };
    
    const validSensors = activeSensors.filter(s => s.temperature > 0);
    if (validSensors.length === 0) return { temp: 0, hum: 0, amm: 0 };
    
    const avgTemp = validSensors.reduce((sum, sensor) => sum + sensor.temperature, 0) / validSensors.length;
    const avgHum = validSensors.reduce((sum, sensor) => sum + sensor.humidity, 0) / validSensors.length;
    const avgAmm = validSensors.reduce((sum, sensor) => sum + sensor.ammonia, 0) / validSensors.length;
    
    return { temp: avgTemp, hum: avgHum, amm: avgAmm };
  };

  const averages = calculateAverages();

  // ⏱️ Effet initial et intervalle
  useEffect(() => {
    fetchAllSensors();
    fetchAlerts();

    const interval = setInterval(() => {
      fetchAllSensors();
      fetchAlerts();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // 🎨 Déterminer la couleur de la carte
  const getTemperatureColor = (temp: number) => {
    if (temp > 35) return "temp-high";
    if (temp < 20) return "temp-low";
    return "temp-normal";
  };

  return (
    <IonPage className="dashboard-container">
      <IonHeader>
        <IonToolbar className="dashboard-header">
          <IonTitle>
            <IonIcon icon={thermometerOutline} /> Poulailler Intelligent
          </IonTitle>
          <IonButton slot="end" fill="clear" onClick={handleRefresh}>
            <IonIcon icon={refreshOutline} />
          </IonButton>
          <IonButton slot="end" fill="clear" color="danger" onClick={handleLogout}>
            <IonIcon icon={logOutOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Bandeau d'alerte */}
        {alerts.length > 0 && (
          <IonCard className="alert-card">
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={warningOutline} /> {alerts.length} Alerte{alerts.length > 1 ? 's' : ''} active{alerts.length > 1 ? 's' : ''}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList lines="none">
                {alerts.slice(0, 2).map(alert => (
                  <IonItem key={alert._id} color="light">
                    <IonLabel>
                      <h3 style={{ fontWeight: 'bold', color: '#333' }}>{alert.type}</h3>
                      <p style={{ color: '#666' }}>{alert.message}</p>
                      <small style={{ color: '#888' }}>
                        {new Date(alert.timestamp).toLocaleString()}
                      </small>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>
        )}

        {/* Sélecteur de vue */}
        <IonSegment 
          value={viewMode} 
          onIonChange={e => setViewMode(e.detail.value as any)}
          className="custom-segment"
        >
          <IonSegmentButton value="overview">
            <IonLabel>
              <IonIcon icon={statsChartOutline} /> Vue d'ensemble
            </IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="detailed">
            <IonLabel>
              <IonIcon icon={listOutline} /> Détail capteurs
            </IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" color="primary" />
            <p className="loading-text">Chargement des données des capteurs...</p>
          </div>
        ) : (
          <>
            {/* Vue d'ensemble */}
            {viewMode === 'overview' && (
              <>
                {/* Stats globales */}
                <div className="stats-grid">
                  <div className="stat-item">
                    <h3>{activeSensors.length}</h3>
                    <p>Capteurs actifs</p>
                  </div>
                  <div className="stat-item">
                    <h3>{safeToFixed(averages.temp, 1)}°C</h3>
                    <p>Temp. moyenne</p>
                  </div>
                  <div className="stat-item">
                    <h3>{safeToFixed(averages.hum, 1)}%</h3>
                    <p>Hum. moyenne</p>
                  </div>
                  <div className="stat-item">
                    <h3>{safeToFixed(averages.amm, 0)} ppm</h3>
                    <p>NH₃ moyen</p>
                  </div>
                </div>

                {/* Graphique d'évolution */}
                {allSensors.length > 0 && (
                  <div className="chart-container">
                    <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>Évolution des températures</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={prepareChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#7f8c8d"
                          fontSize={12}
                        />
                        <YAxis 
                          label={{ value: '°C', angle: -90, position: 'insideLeft' }}
                          stroke="#7f8c8d"
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="temp" 
                          name="Température"
                          stroke="#667eea"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Vue rapide des capteurs */}
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>📊 État des capteurs</IonCardTitle>
                    <IonCardSubtitle>Dernière mise à jour: {lastUpdate}</IonCardSubtitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonGrid>
                      <IonRow>
                        {activeSensors.map(sensor => (
                          <IonCol size="6" sizeMd="4" key={sensor._id}>
                            <div className="sensor-value">
                              <IonIcon icon={thermometerOutline} />
                              <h2>{safeToFixed(sensor.temperature, 1)}°C</h2>
                              <p>Capteur {sensor.capteurNum}</p>
                              <IonChip 
                                color={sensor.temperature > 35 ? "danger" : sensor.temperature < 20 ? "warning" : "success"}
                              >
                                {sensor.temperature > 35 ? "Chaud" : sensor.temperature < 20 ? "Froid" : "Normal"}
                              </IonChip>
                            </div>
                          </IonCol>
                        ))}
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              </>
            )}

            {/* Vue détaillée - LES 3 CAPTEURS */}
            {viewMode === 'detailed' && (
              <IonGrid>
                <IonRow>
                  {activeSensors.map(sensor => (
                    <IonCol size="12" sizeMd="6" sizeLg="4" key={sensor._id}>
                      <IonCard className={`sensor-card ${getTemperatureColor(sensor.temperature)}`}>
                        <IonCardHeader>
                          <IonCardTitle>
                            📟 Capteur {sensor.capteurNum}
                          </IonCardTitle>
                          <IonCardSubtitle>
                            Mis à jour: {sensor.lastUpdated}
                          </IonCardSubtitle>
                        </IonCardHeader>
                        <IonCardContent>
                          <IonGrid>
                            <IonRow>
                              <IonCol size="6">
                                <div className="sensor-value">
                                  <IonIcon icon={thermometerOutline} />
                                  <h2>{safeToFixed(sensor.temperature, 1)}°C</h2>
                                  <p>Température</p>
                                </div>
                              </IonCol>
                              <IonCol size="6">
                                <div className="sensor-value">
                                  <IonIcon icon={waterOutline} />
                                  <h2>{safeToFixed(sensor.humidity, 1)}%</h2>
                                  <p>Humidité</p>
                                </div>
                              </IonCol>
                            </IonRow>
                            <IonRow>
                              <IonCol size="6">
                                <div className="sensor-value">
                                  <IonIcon icon={warningOutline} />
                                  <h2>{safeToFixed(sensor.ammonia, 0)} ppm</h2>
                                  <p>Ammoniac</p>
                                </div>
                              </IonCol>
                              <IonCol size="6">
                                <div className="sensor-value">
                                  <IonIcon icon={sunnyOutline} />
                                  <h2>{safeToFixed(sensor.luminosity, 0)} lx</h2>
                                  <p>Luminosité</p>
                                </div>
                              </IonCol>
                            </IonRow>
                          </IonGrid>
                          <div style={{ marginTop: '15px', textAlign: 'center' }}>
                            <small style={{ color: '#95a5a6', fontSize: '0.8rem' }}>
                              ID: {sensor.deviceId}
                            </small>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            )}

            {/* Contrôle des actionneurs */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>⚙️ Contrôle manuel</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol>
                      <IonButton 
                        expand="block"
                        className={`control-button ${controls.fan ? 'control-button-on' : 'control-button-off'}`}
                        onClick={() => controlESP32('fan', controls.fan ? 'off' : 'on')}
                      >
                        <IonIcon icon={flashOutline} slot="start" />
                        {controls.fan ? "Ventilateur ON" : "Ventilateur OFF"}
                      </IonButton>
                    </IonCol>
                    <IonCol>
                      <IonButton 
                        expand="block"
                        className={`control-button ${controls.lamp ? 'control-button-on' : 'control-button-off'}`}
                        onClick={() => controlESP32('lamp', controls.lamp ? 'off' : 'on')}
                      >
                        <IonIcon icon={bulbOutline} slot="start" />
                        {controls.lamp ? "Lampe ON" : "Lampe OFF"}
                      </IonButton>
                    </IonCol>
                    <IonCol>
                      <IonButton 
                        expand="block"
                        className={`control-button ${controls.water ? 'control-button-on' : 'control-button-off'}`}
                        onClick={() => controlESP32('water', controls.water ? 'off' : 'on')}
                      >
                        <IonIcon icon={waterOutline} slot="start" />
                        {controls.water ? "Eau ON" : "Eau OFF"}
                      </IonButton>
                    </IonCol>
                  </IonRow>
                  <IonRow>
                    <IonCol className="ion-text-center" style={{ marginTop: '15px' }}>
                      <IonButton 
                        color="medium" 
                        fill="outline"
                        onClick={() => {
                          controlESP32('fan', 'off');
                          controlESP32('lamp', 'off');
                          controlESP32('water', 'off');
                          setControls({ fan: false, lamp: false, water: false });
                        }}
                      >
                        Tout éteindre
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>

            {/* Informations système */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>📋 Informations système</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol>
                      <div className="sensor-value" style={{ background: 'transparent' }}>
                        <h3 style={{ color: '#667eea' }}>{allSensors.length}</h3>
                        <p>Relevés totaux</p>
                      </div>
                    </IonCol>
                    <IonCol>
                      <div className="sensor-value" style={{ background: 'transparent' }}>
                        <h3 style={{ color: '#667eea' }}>{activeSensors.length}</h3>
                        <p>Capteurs actifs</p>
                      </div>
                    </IonCol>
                    <IonCol>
                      <div className="sensor-value" style={{ background: 'transparent' }}>
                        <h3 style={{ color: '#667eea' }}>{alerts.length}</h3>
                        <p>Alertes actives</p>
                      </div>
                    </IonCol>
                    <IonCol>
                      <div className="sensor-value" style={{ background: 'transparent' }}>
                        <h3 style={{ color: '#667eea' }}>{lastUpdate}</h3>
                        <p>Dernière mise à jour</p>
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>
          </>
        )}

        {/* Alert Ionic */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="⚠️ Alerte détectée"
          message={alertMessage}
          buttons={['Compris']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;