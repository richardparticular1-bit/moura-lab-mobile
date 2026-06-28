import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BatteryCharging,
  Camera,
  Compass,
  Gauge,
  LocateFixed,
  Mic,
  MonitorSmartphone,
  Network,
  Radio,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Video,
  Wifi,
} from 'lucide-react';
import './styles.css';

type PermissionStateLabel = 'aguardando' | 'ativo' | 'bloqueado' | 'indisponivel';

type DeviceOrientationWithCompass = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

type MotionPermissionEvent = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

type OrientationPermissionEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

type BatteryManager = EventTarget & {
  charging: boolean;
  level: number;
};

type NavigatorWithSensors = Navigator & {
  getBattery?: () => Promise<BatteryManager>;
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
};

type WindowWithAudioFallback = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const formatNumber = (value: number | null, suffix = '') => {
  if (value === null || Number.isNaN(value)) {
    return '--';
  }

  return `${value.toFixed(1)}${suffix}`;
};

const statusLabel: Record<PermissionStateLabel, string> = {
  aguardando: 'Aguardando permissao',
  ativo: 'Ativo',
  bloqueado: 'Bloqueado',
  indisponivel: 'Indisponivel',
};

function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const [cameraState, setCameraState] = useState<PermissionStateLabel>('aguardando');
  const [microphoneState, setMicrophoneState] = useState<PermissionStateLabel>('aguardando');
  const [motionState, setMotionState] = useState<PermissionStateLabel>('aguardando');
  const [locationState, setLocationState] = useState<PermissionStateLabel>('aguardando');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [soundLevel, setSoundLevel] = useState(0);
  const [motion, setMotion] = useState({
    x: null as number | null,
    y: null as number | null,
    z: null as number | null,
    rotation: null as number | null,
  });
  const [orientation, setOrientation] = useState({
    alpha: null as number | null,
    beta: null as number | null,
    gamma: null as number | null,
    compass: null as number | null,
  });
  const [position, setPosition] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    accuracy: null as number | null,
  });
  const [battery, setBattery] = useState({
    supported: false,
    charging: false,
    level: null as number | null,
  });
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches,
  );
  const [lastError, setLastError] = useState('');
  const isSecure = window.isSecureContext;

  const network = (navigator as NavigatorWithSensors).connection;

  const availableSensors = useMemo(
    () => [
      {
        name: 'Cameras',
        value: devices.filter((device) => device.kind === 'videoinput').length,
        icon: Camera,
      },
      {
        name: 'Microfones',
        value: devices.filter((device) => device.kind === 'audioinput').length,
        icon: Mic,
      },
      {
        name: 'Movimento',
        value: 'DeviceMotionEvent' in window ? 1 : 0,
        icon: Gauge,
      },
      {
        name: 'Orientacao',
        value: 'DeviceOrientationEvent' in window ? 1 : 0,
        icon: Compass,
      },
    ],
    [devices],
  );

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    navigator.mediaDevices
      ?.enumerateDevices()
      .then(setDevices)
      .catch(() => setDevices([]));

    const sensorNavigator = navigator as NavigatorWithSensors;
    sensorNavigator
      .getBattery?.()
      .then((manager) => {
        const syncBattery = () =>
          setBattery({
            supported: true,
            charging: manager.charging,
            level: Math.round(manager.level * 100),
          });

        syncBattery();
        manager.addEventListener('chargingchange', syncBattery);
        manager.addEventListener('levelchange', syncBattery);
      })
      .catch(() => setBattery((current) => ({ ...current, supported: false })));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      stopAll();
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  const stopAudioMeter = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setSoundLevel(0);
  };

  const stopAll = () => {
    mediaStream?.getTracks().forEach((track) => track.stop());
    stopAudioMeter();
    setMediaStream(null);
  };

  const updateDeviceList = async () => {
    try {
      const nextDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(nextDevices);
    } catch {
      setDevices([]);
    }
  };

  const startMedia = async (nextFacingMode = facingMode) => {
    if (!isSecure) {
      setCameraState('bloqueado');
      setMicrophoneState('bloqueado');
      setLastError('Camera e microfone exigem HTTPS quando o celular acessa pela rede.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('indisponivel');
      setMicrophoneState('indisponivel');
      setLastError('Este navegador nao disponibilizou getUserMedia para camera e microfone.');
      return;
    }

    try {
      stopAll();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacingMode } },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setMediaStream(stream);
      setCameraState(stream.getVideoTracks().length ? 'ativo' : 'indisponivel');
      setMicrophoneState(stream.getAudioTracks().length ? 'ativo' : 'indisponivel');
      setLastError('');
      await updateDeviceList();
      startAudioMeter(stream);
    } catch (error) {
      setCameraState('bloqueado');
      setMicrophoneState('bloqueado');
      setLastError(error instanceof Error ? error.message : 'Permissao de camera ou microfone negada.');
    }
  };

  const startAudioMeter = (stream: MediaStream) => {
    stopAudioMeter();
    const audioTracks = stream.getAudioTracks();

    if (!audioTracks.length) {
      return;
    }

    const AudioContextConstructor =
      window.AudioContext || (window as WindowWithAudioFallback).webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    const audioContext = new AudioContextConstructor();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(new MediaStream(audioTracks));
    const samples = new Uint8Array(analyser.frequencyBinCount);

    analyser.fftSize = 256;
    source.connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const tick = () => {
      analyser.getByteFrequencyData(samples);
      const average = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
      setSoundLevel(Math.min(100, Math.round((average / 140) * 100)));
      animationRef.current = requestAnimationFrame(tick);
    };

    tick();
  };

  const switchCamera = () => {
    const nextFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacingMode);
    void startMedia(nextFacingMode);
  };

  const requestMotionAccess = async () => {
    if (!isSecure) {
      setMotionState('bloqueado');
      setLastError('Sensores de movimento e orientacao exigem HTTPS em celulares modernos.');
      return;
    }

    if (!('DeviceMotionEvent' in window) && !('DeviceOrientationEvent' in window)) {
      setMotionState('indisponivel');
      setLastError('Este navegador nao disponibilizou eventos de movimento/orientacao.');
      return;
    }

    try {
      const motionEvent = DeviceMotionEvent as MotionPermissionEvent;
      const orientationEvent = DeviceOrientationEvent as OrientationPermissionEvent;
      const motionPermission = motionEvent.requestPermission
        ? await motionEvent.requestPermission()
        : 'granted';
      const orientationPermission = orientationEvent.requestPermission
        ? await orientationEvent.requestPermission()
        : 'granted';

      if (motionPermission !== 'granted' || orientationPermission !== 'granted') {
        setMotionState('bloqueado');
        setLastError('Permissao de movimento/orientacao negada pelo sistema.');
        return;
      }

      window.addEventListener('devicemotion', handleMotion);
      window.addEventListener('deviceorientation', handleOrientation);
      setMotionState('ativo');
      setLastError('');
    } catch (error) {
      setMotionState('bloqueado');
      setLastError(error instanceof Error ? error.message : 'Nao foi possivel ativar os sensores.');
    }
  };

  const handleMotion = (event: DeviceMotionEvent) => {
    setMotion({
      x: event.accelerationIncludingGravity?.x ?? null,
      y: event.accelerationIncludingGravity?.y ?? null,
      z: event.accelerationIncludingGravity?.z ?? null,
      rotation: event.rotationRate?.alpha ?? null,
    });
  };

  const handleOrientation = (event: DeviceOrientationWithCompass) => {
    setOrientation({
      alpha: event.alpha ?? null,
      beta: event.beta ?? null,
      gamma: event.gamma ?? null,
      compass: event.webkitCompassHeading ?? event.alpha ?? null,
    });
  };

  const requestLocation = () => {
    if (!isSecure) {
      setLocationState('bloqueado');
      setLastError('GPS exige HTTPS quando o celular acessa pela rede.');
      return;
    }

    if (!navigator.geolocation) {
      setLocationState('indisponivel');
      setLastError('Este navegador nao disponibilizou geolocalizacao.');
      return;
    }

    navigator.geolocation.watchPosition(
      (nextPosition) => {
        setLocationState('ativo');
        setPosition({
          latitude: nextPosition.coords.latitude,
          longitude: nextPosition.coords.longitude,
          accuracy: nextPosition.coords.accuracy,
        });
        setLastError('');
      },
      (error) => {
        setLocationState('bloqueado');
        setLastError(error.message || 'Permissao de GPS negada.');
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
    );
  };

  const installApp = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setInstalled(true);
    }

    setInstallPrompt(null);
  };

  return (
    <main className="app-shell">
      <section className="phone-stage" aria-label="Monitor de sensores do celular">
        <header className="hero">
          <div>
            <p className="eyebrow">Moura Lab Mobile</p>
            <h1>Central de sensores do celular</h1>
            <p>
              Painel web para testar camera, microfone, movimento, orientacao,
              localizacao, bateria, rede e dispositivos disponiveis com permissao do usuario.
            </p>
          </div>
          <div className="hero-actions">
            <button
              className="install"
              disabled={!installPrompt || installed}
              onClick={() => void installApp()}
              type="button"
            >
              <Smartphone size={18} /> {installed ? 'App instalado' : 'Instalar app'}
            </button>
            <button onClick={() => void startMedia()} type="button">
              <Video size={18} /> Ativar camera e mic
            </button>
            <button className="secondary" onClick={requestMotionAccess} type="button">
              <Radio size={18} /> Ativar sensores
            </button>
          </div>
        </header>

        {!isSecure ? (
          <section className="security-note" aria-label="Conexao insegura">
            <ShieldCheck size={18} />
            <span>
              Este endereco esta em HTTP. No celular, instale e use camera, microfone,
              GPS e sensores abrindo o app por HTTPS.
            </span>
          </section>
        ) : null}

        {!installPrompt && !installed ? (
          <section className="install-note" aria-label="Instrucao de instalacao">
            <Smartphone size={18} />
            <span>
              No iPhone, abra no Safari e use Compartilhar &gt; Adicionar a Tela de Inicio.
              No Android, abra pelo Chrome em HTTPS e toque em Instalar app.
            </span>
          </section>
        ) : null}

        {lastError ? (
          <section className="error-note" aria-label="Ultimo erro">
            <span>{lastError}</span>
          </section>
        ) : null}

        <section className="live-grid">
          <article className="camera-panel">
            <div className="panel-title">
              <Camera size={20} />
              <div>
                <h2>Camera ao vivo</h2>
                <span>{facingMode === 'environment' ? 'Traseira preferencial' : 'Frontal preferencial'}</span>
              </div>
            </div>
            <div className="video-frame">
              {mediaStream ? (
                <video ref={videoRef} autoPlay muted playsInline />
              ) : (
                <div className="empty-video">
                  <Smartphone size={48} />
                  <span>Toque para iniciar a permissao da camera</span>
                </div>
              )}
            </div>
            <div className="toolbar">
              <button onClick={switchCamera} type="button">
                <RefreshCw size={18} /> Alternar
              </button>
              <button className="danger" onClick={stopAll} type="button">
                Pausar captura
              </button>
            </div>
          </article>

          <aside className="sensor-stack">
            <StatusCard icon={Camera} label="Camera" state={cameraState} />
            <StatusCard icon={Mic} label="Microfone" state={microphoneState} />
            <StatusCard icon={Gauge} label="Movimento" state={motionState} />
            <StatusCard icon={LocateFixed} label="Localizacao" state={locationState} />
          </aside>
        </section>

        <section className="telemetry-grid">
          <article className="panel">
            <div className="panel-title">
              <Mic size={20} />
              <h2>Microfone</h2>
            </div>
            <div className="meter" aria-label={`Nivel do microfone ${soundLevel}%`}>
              <span style={{ width: `${soundLevel}%` }} />
            </div>
            <strong>{soundLevel}%</strong>
            <p>Nivel instantaneo do audio local. O app nao grava nem envia o som.</p>
          </article>

          <article className="panel">
            <div className="panel-title">
              <Compass size={20} />
              <h2>Orientacao</h2>
            </div>
            <DataRows
              rows={[
                ['Bussola', formatNumber(orientation.compass, 'deg')],
                ['Alpha', formatNumber(orientation.alpha, 'deg')],
                ['Beta', formatNumber(orientation.beta, 'deg')],
                ['Gamma', formatNumber(orientation.gamma, 'deg')],
              ]}
            />
          </article>

          <article className="panel">
            <div className="panel-title">
              <Gauge size={20} />
              <h2>Acelerometro</h2>
            </div>
            <DataRows
              rows={[
                ['X', formatNumber(motion.x, ' m/s2')],
                ['Y', formatNumber(motion.y, ' m/s2')],
                ['Z', formatNumber(motion.z, ' m/s2')],
                ['Rotacao', formatNumber(motion.rotation, 'deg/s')],
              ]}
            />
          </article>

          <article className="panel">
            <div className="panel-title">
              <LocateFixed size={20} />
              <h2>Localizacao</h2>
            </div>
            <DataRows
              rows={[
                ['Latitude', formatNumber(position.latitude)],
                ['Longitude', formatNumber(position.longitude)],
                ['Precisao', formatNumber(position.accuracy, ' m')],
              ]}
            />
            <button className="inline-action" onClick={requestLocation} type="button">
              <LocateFixed size={18} /> Solicitar GPS
            </button>
          </article>
        </section>

        <section className="device-grid">
          {availableSensors.map((item) => {
            const Icon = item.icon;
            return (
              <article className="device-card" key={item.name}>
                <Icon size={22} />
                <span>{item.name}</span>
                <strong>{item.value}</strong>
              </article>
            );
          })}

          <article className="device-card">
            <BatteryCharging size={22} />
            <span>Bateria</span>
            <strong>{battery.supported ? `${battery.level}%` : '--'}</strong>
            <small>{battery.supported ? (battery.charging ? 'Carregando' : 'Em uso') : 'Nao exposta'}</small>
          </article>

          <article className="device-card">
            <Wifi size={22} />
            <span>Rede</span>
            <strong>{network?.effectiveType ?? '--'}</strong>
            <small>{network?.downlink ? `${network.downlink} Mbps` : 'API limitada'}</small>
          </article>

          <article className="device-card">
            <MonitorSmartphone size={22} />
            <span>Tela</span>
            <strong>
              {window.screen.width} x {window.screen.height}
            </strong>
            <small>{Math.round(window.devicePixelRatio * 100)}% densidade</small>
          </article>

          <article className="device-card privacy">
            <ShieldCheck size={22} />
            <span>Privacidade</span>
            <strong>Local</strong>
            <small>Nenhum dado sai do aparelho</small>
          </article>
        </section>

        <section className="panel device-list">
          <div className="panel-title">
            <Network size={20} />
            <h2>Entradas detectadas</h2>
          </div>
          <div className="devices">
            {devices.length ? (
              devices.map((device, index) => (
                <span key={`${device.kind}-${device.deviceId || index}`}>
                  {device.label || `${device.kind} ${index + 1}`}
                </span>
              ))
            ) : (
              <span>Permita camera/microfone para listar os dispositivos pelo nome.</span>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function StatusCard({
  icon: Icon,
  label,
  state,
}: {
  icon: typeof Camera;
  label: string;
  state: PermissionStateLabel;
}) {
  return (
    <article className="status-card" data-state={state}>
      <Icon size={20} />
      <div>
        <span>{label}</span>
        <strong>{statusLabel[state]}</strong>
      </div>
    </article>
  );
}

function DataRows({ rows }: { rows: [string, string][] }) {
  return (
    <div className="data-rows">
      {rows.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
