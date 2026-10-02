import React, { createContext, useContext, useState, useEffect } from 'react';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speechLang: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', speechLang: 'en-US' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', speechLang: 'ta-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', speechLang: 'hi-IN' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', speechLang: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', speechLang: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', speechLang: 'de-DE' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', speechLang: 'ja-JP' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', speechLang: 'zh-CN' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪', speechLang: 'ar-SA' },
];

type Translations = Record<string, Record<string, string>>;

const translations: Translations = {
  en: {
    // Nav
    'nav.liveTracking': 'Live Tracking',
    'nav.controlCenter': 'Control Center',
    'nav.childTracking': 'Child Tracking',
    'nav.myBus': 'My Bus',
    'nav.routes': 'Routes',
    'nav.alerts': 'Alerts',
    'nav.transitAi': 'Transit AI & Maps',
    'nav.worldMap': 'World Transit Map',
    'nav.overview': 'Overview',
    'nav.voiceChat': 'AI Voice Chat',
    'nav.role': 'Role',
    'nav.signIn': 'Sign In',
    'nav.signOut': 'Sign Out',

    // Voice Chat
    'voice.title': 'MyBus AI Voice Assistant',
    'voice.subtitle': 'Real-time conversational voice assistant powered by Gemini 3.8 Flash & Gemini TTS.',
    'voice.listening': 'Listening... Speak your transit question',
    'voice.transcribing': 'Processing voice with Gemini...',
    'voice.clickToSpeak': 'Tap Microphone to Speak',
    'voice.stopListening': 'Tap to Finish Speaking',
    'voice.inputPlaceholder': 'Or type transit query or click suggested voice prompt...',
    'voice.send': 'Send Voice Command',
    'voice.clearHistory': 'Clear Conversation',
    'voice.playingAudio': 'Playing AI voice response...',
    'voice.speechVoice': 'Gemini Voice Model',
    'voice.language': 'Language',
    'voice.chip1': 'Where is Bus 75 right now and what is the ETA?',
    'voice.chip2': 'Are there any traffic delays on OMR IT Corridor Route 2?',
    'voice.chip3': 'How do I reach the college campus from Chennai Central?',
    'voice.chip4': 'Who is the driver and what is the emergency contact?',

    // World Map
    'world.badge': 'Autonomous Geospatial Network',
    'world.title': 'Global Fleet & World Transit Command',
    'world.subtitle': 'Interactive high-resolution planetary transit grid linking smart university campuses and global high-speed hubs.',
    'world.zoomIn': 'Zoom In',
    'world.zoomOut': 'Zoom Out',
    'world.resetView': 'Reset View',
    'world.sectorScan': 'Run Sector Telemetry Scan',
    'world.sectorScanning': 'Scanning Planetary Transit Grid...',
    'world.hubDetails': 'Selected Transit Hub Telemetry',
    'world.liveFleet': 'Active Fleet Coaches',
    'world.onTime': 'On-Time Performance',
    'world.passengers': 'Tracked Passengers',
    'world.jumpToCampus': 'Switch to Campus Radar',
    'world.openVoice': 'Voice Inquire Hub',
    'world.modes': 'Map Visual Filter',

    // Common
    'common.active': 'Active',
    'common.delayed': 'Delayed',
    'common.students': 'Students',
    'common.routes': 'Routes',
    'common.buses': 'Fleet Buses',
  },

  ta: {
    // Nav
    'nav.liveTracking': 'நேரடி கண்காணிப்பு',
    'nav.controlCenter': 'கட்டுப்பாட்டு மையம்',
    'nav.childTracking': 'குழந்தை கண்காணிப்பு',
    'nav.myBus': 'எனது பேருந்து',
    'nav.routes': 'வழித்தடங்கள்',
    'nav.alerts': 'எச்சரிக்கைகள்',
    'nav.transitAi': 'போக்குவரத்து AI & வரைபடம்',
    'nav.worldMap': 'உலக வரைபடம்',
    'nav.overview': 'மேலோட்டம்',
    'nav.voiceChat': 'AI குரல் அரட்டை',
    'nav.role': 'பங்கு',
    'nav.signIn': 'உள்நுழைக',
    'nav.signOut': 'வெளியேறு',

    // Voice Chat
    'voice.title': 'MyBus AI குரல் உதவியாளர்',
    'voice.subtitle': 'Gemini 3.8 Flash & Gemini TTS இயங்கும் நேரடி உரையாடல் குரல் உதவியாளர்.',
    'voice.listening': 'கேட்கிறது... உங்கள் கேள்வியைப் பேசுங்கள்',
    'voice.transcribing': 'குரல் செயலாக்கப்படுகிறது...',
    'voice.clickToSpeak': 'பேச மைக்ரோஃபோனைத் தொடவும்',
    'voice.stopListening': 'பேசி முடித்ததும் அழுத்தவும்',
    'voice.inputPlaceholder': 'அல்லது உங்கள் கேள்வியை தட்டச்சு செய்யவும்...',
    'voice.send': 'அனுப்பு',
    'voice.clearHistory': 'அரட்டையை அழிக்கவும்',
    'voice.playingAudio': 'AI குரல் ஒலிக்கிறது...',
    'voice.speechVoice': 'Gemini குரல் மாதிரி',
    'voice.language': 'மொழி',
    'voice.chip1': 'பேருந்து 75 இப்போது எங்கே உள்ளது? வரவு நேரம் என்ன?',
    'voice.chip2': 'OMR பாதையில் ஏதேனும் போக்குவரத்து தாமதம் உள்ளதா?',
    'voice.chip3': 'சென்னை சென்ட்ரலில் இருந்து கல்லூரிக்கு எப்படி செல்வது?',
    'voice.chip4': 'அவசர கால உதவி எண் மற்றும் ஓட்டுநர் தகவல் என்ன?',

    // World Map
    'world.badge': 'சர்வதேச செயற்கைக்கோள் நெட்வொர்க்',
    'world.title': 'உலகளாவிய போக்குவரத்து & உலக வரைபடம்',
    'world.subtitle': 'சர்வதேச ஸ்மார்ட் பல்கலைக்கழகங்கள் மற்றும் அதிவேக போக்குவரத்து மையங்களின் ஊடாடும் வரைபடம்.',
    'world.zoomIn': 'பெரிதாக்கு',
    'world.zoomOut': 'சிறிதாக்கு',
    'world.resetView': 'மீட்டமை',
    'world.sectorScan': 'ஸ்கேன் இயக்கவும்',
    'world.sectorScanning': 'ஸ்கேன் செய்யப்படுகிறது...',
    'world.hubDetails': 'தேர்ந்தெடுக்கப்பட்ட மைய தகவல்',
    'world.liveFleet': 'இயங்கும் பேருந்துகள்',
    'world.onTime': 'நேரக்கட்டுப்பாடு விகிதம்',
    'world.passengers': 'பயணிகள் எண்ணிக்கை',
    'world.jumpToCampus': 'வளாக ரேடாரிற்கு செல்',
    'world.openVoice': 'குரல் வழியே வினவு',
    'world.modes': 'காட்சி வடிகட்டி',

    // Common
    'common.active': 'செயலில்',
    'common.delayed': 'தாமதம்',
    'common.students': 'மாணவர்கள்',
    'common.routes': 'வழித்தடங்கள்',
    'common.buses': 'பேருந்துகள்',
  },

  hi: {
    // Nav
    'nav.liveTracking': 'लाइव ट्रैकिंग',
    'nav.controlCenter': 'कंट्रोल सेंटर',
    'nav.childTracking': 'चाइल्ड ट्रैकिंग',
    'nav.myBus': 'मेरी बस',
    'nav.routes': 'मार्ग',
    'nav.alerts': 'अलर्ट्स',
    'nav.transitAi': 'ट्रांजिट एआई व मैप्स',
    'nav.worldMap': 'विश्व मैप',
    'nav.overview': 'अवलोकन',
    'nav.voiceChat': 'एआई वॉयस चैट',
    'nav.role': 'भूमिका',
    'nav.signIn': 'साइन इन',
    'nav.signOut': 'साइन आउट',

    // Voice Chat
    'voice.title': 'MyBus एआई वॉयस असिस्टेंट',
    'voice.subtitle': 'Gemini 3.8 Flash और Gemini TTS द्वारा संचालित रीयल-टाइम वॉइस असिस्टेंट।',
    'voice.listening': 'सुन रहा है... अपना प्रश्न बोलें',
    'voice.transcribing': 'Gemini द्वारा आवाज़ प्रोसेस की जा रही है...',
    'voice.clickToSpeak': 'बोलने के लिए माइक दबाएं',
    'voice.stopListening': 'बोलना समाप्त करने के लिए दबाएं',
    'voice.inputPlaceholder': 'या अपना सवाल यहां टाइप करें...',
    'voice.send': 'भेजें',
    'voice.clearHistory': 'चैट साफ करें',
    'voice.playingAudio': 'एआई वॉयस प्ले हो रही है...',
    'voice.speechVoice': 'Gemini वॉइस मॉडल',
    'voice.language': 'भाषा',
    'voice.chip1': 'बस 75 अभी कहां है और पहुंचने का अनुमानित समय क्या है?',
    'voice.chip2': 'क्या ओएमआर रूट पर कोई ट्रैफिक देरी है?',
    'voice.chip3': 'सेंट्रल स्टेशन से कॉलेज कैंपस कैसे पहुंचें?',
    'voice.chip4': 'आपातकालीन सहायता नंबर और ड्राइवर विवरण क्या है?',

    // World Map
    'world.badge': 'ग्लोबल सैटेलाइट नेटवर्क',
    'world.title': 'ग्लोबल फ्लीट एवं विश्व ट्रांजिट मैप',
    'world.subtitle': 'स्मार्ट विश्वविद्यालयों और अंतरराष्ट्रीय हाई-स्पीड हब्स को जोड़ने वाला इंटरैक्टिव ग्रिड।',
    'world.zoomIn': 'ज़ूम इन',
    'world.zoomOut': 'ज़ूम आउट',
    'world.resetView': 'रीसेट व्यू',
    'world.sectorScan': 'सेक्टर टेलीमेट्री स्कैन करें',
    'world.sectorScanning': 'स्कैन चालू है...',
    'world.hubDetails': 'चयनित ट्रांजिट हब विवरण',
    'world.liveFleet': 'सक्रिय बसें',
    'world.onTime': 'समयबद्धता दर',
    'world.passengers': 'ट्रैक किए गए छात्र',
    'world.jumpToCampus': 'कैंपस रडार देखें',
    'world.openVoice': 'वॉयस इंक्वायरी करें',
    'world.modes': 'विजुअल मोड',

    // Common
    'common.active': 'सक्रिय',
    'common.delayed': 'विलंबित',
    'common.students': 'छात्र',
    'common.routes': 'मार्ग',
    'common.buses': 'बसें',
  },

  es: {
    // Nav
    'nav.liveTracking': 'Seguimiento en Vivo',
    'nav.controlCenter': 'Centro de Control',
    'nav.childTracking': 'Rastreo de Hijos',
    'nav.myBus': 'Mi Autobús',
    'nav.routes': 'Rutas',
    'nav.alerts': 'Alertas',
    'nav.transitAi': 'IA de Tránsito y Mapas',
    'nav.worldMap': 'Mapa Mundial',
    'nav.overview': 'Resumen',
    'nav.voiceChat': 'Chat de Voz con IA',
    'nav.role': 'Rol',
    'nav.signIn': 'Iniciar Sesión',
    'nav.signOut': 'Cerrar Sesión',

    // Voice Chat
    'voice.title': 'Asistente de Voz IA MyBus',
    'voice.subtitle': 'Asistente de voz conversacional impulsado por Gemini 3.8 Flash y Gemini TTS.',
    'voice.listening': 'Escuchando... Hable ahora',
    'voice.transcribing': 'Transcribiendo con Gemini...',
    'voice.clickToSpeak': 'Tocar micrófono para hablar',
    'voice.stopListening': 'Tocar para terminar de hablar',
    'voice.inputPlaceholder': 'O escriba su consulta de tránsito...',
    'voice.send': 'Enviar',
    'voice.clearHistory': 'Borrar historial',
    'voice.playingAudio': 'Reproduciendo audio de IA...',
    'voice.speechVoice': 'Modelo de voz Gemini',
    'voice.language': 'Idioma',
    'voice.chip1': '¿Dónde está el autobús 75 ahora y cuál es su tiempo estimado de llegada?',
    'voice.chip2': '¿Hay retrasos de tráfico en la ruta del corredor OMR?',
    'voice.chip3': '¿Cómo llego al campus desde la estación central?',
    'voice.chip4': '¿Cuál es el contacto de emergencia y el conductor asignado?',

    // World Map
    'world.badge': 'Red Geoespacial Planetaria',
    'world.title': 'Flota Global y Mapa Mundial de Tránsito',
    'world.subtitle': 'Malla interactiva de alta definición que conecta campus universitarios y centros globales.',
    'world.zoomIn': 'Acercar',
    'world.zoomOut': 'Alejar',
    'world.resetView': 'Restablecer',
    'world.sectorScan': 'Escanear Telemetría de Sector',
    'world.sectorScanning': 'Escaneando cuadrícula planetaria...',
    'world.hubDetails': 'Telemetría del Centro Seleccionado',
    'world.liveFleet': 'Autobuses Activos',
    'world.onTime': 'Puntualidad',
    'world.passengers': 'Pasajeros Rastreados',
    'world.jumpToCampus': 'Ir a Radar del Campus',
    'world.openVoice': 'Consultar por Voz',
    'world.modes': 'Filtro Visual',

    // Common
    'common.active': 'Activo',
    'common.delayed': 'Retrasado',
    'common.students': 'Estudiantes',
    'common.routes': 'Rutas',
    'common.buses': 'Autobuses',
  },

  fr: {
    'nav.liveTracking': 'Suivi en Direct',
    'nav.controlCenter': 'Centre de Contrôle',
    'nav.childTracking': 'Suivi Enfant',
    'nav.myBus': 'Mon Bus',
    'nav.routes': 'Lignes',
    'nav.alerts': 'Alertes',
    'nav.transitAi': 'IA Transit & Cartes',
    'nav.worldMap': 'Carte Mondiale',
    'nav.overview': 'Aperçu',
    'nav.voiceChat': 'Chat Vocal IA',
    'nav.role': 'Rôle',
    'nav.signIn': 'Connexion',
    'nav.signOut': 'Déconnexion',

    'voice.title': 'Assistant Vocal IA MyBus',
    'voice.subtitle': 'Assistant vocal conversationnel optimisé par Gemini 3.8 Flash & Gemini TTS.',
    'voice.listening': 'Écoute en cours... Posez votre question',
    'voice.transcribing': 'Transcription en cours...',
    'voice.clickToSpeak': 'Appuyez pour parler',
    'voice.stopListening': 'Appuyez pour terminer',
    'voice.inputPlaceholder': 'Ou saisissez votre question...',
    'voice.send': 'Envoyer',
    'voice.clearHistory': 'Effacer l’historique',
    'voice.playingAudio': 'Lecture de la réponse vocale...',
    'voice.speechVoice': 'Voix Gemini',
    'voice.language': 'Langue',
    'voice.chip1': 'Où se trouve le bus 75 et quelle est son heure d’arrivée ?',
    'voice.chip2': 'Y a-t-il des retards sur la ligne OMR IT ?',
    'voice.chip3': 'Comment rejoindre le campus depuis la gare centrale ?',
    'voice.chip4': 'Quel est le contact d’urgence et le conducteur ?',

    'world.badge': 'Réseau Géospatial Mondial',
    'world.title': 'Flotte Mondiale & Carte de Transit',
    'world.subtitle': 'Réseau interactif reliant les campus intelligents et les hubs à grande vitesse.',
    'world.zoomIn': 'Zoom avant',
    'world.zoomOut': 'Zoom arrière',
    'world.resetView': 'Réinitialiser',
    'world.sectorScan': 'Balayer la télémétrie',
    'world.sectorScanning': 'Balayage en cours...',
    'world.hubDetails': 'Détails du Hub Sélectionné',
    'world.liveFleet': 'Bus en Service',
    'world.onTime': 'Ponctualité',
    'world.passengers': 'Passagers Suivis',
    'world.jumpToCampus': 'Radar du Campus',
    'world.openVoice': 'Question Vocale',
    'world.modes': 'Mode Visuel',

    'common.active': 'Actif',
    'common.delayed': 'Retardé',
    'common.students': 'Étudiants',
    'common.routes': 'Lignes',
    'common.buses': 'Bus',
  },

  de: {
    'nav.liveTracking': 'Live-Verfolgung',
    'nav.controlCenter': 'Kontrollzentrum',
    'nav.childTracking': 'Kinder-Tracking',
    'nav.myBus': 'Mein Bus',
    'nav.routes': 'Routen',
    'nav.alerts': 'Warnungen',
    'nav.transitAi': 'Transit KI & Karten',
    'nav.worldMap': 'Weltkarte',
    'nav.overview': 'Übersicht',
    'nav.voiceChat': 'KI-Sprachchat',
    'nav.role': 'Rolle',
    'nav.signIn': 'Anmelden',
    'nav.signOut': 'Abmelden',

    'voice.title': 'MyBus KI-Sprachassistent',
    'voice.subtitle': 'Konversationeller Sprachassistent betrieben von Gemini 3.8 Flash & Gemini TTS.',
    'voice.listening': 'Hört zu... Stellen Sie Ihre Frage',
    'voice.transcribing': 'Gemini verarbeitet Sprache...',
    'voice.clickToSpeak': 'Mikrofon zum Sprechen drücken',
    'voice.stopListening': 'Zum Beenden drücken',
    'voice.inputPlaceholder': 'Oder Transit-Frage eingeben...',
    'voice.send': 'Senden',
    'voice.clearHistory': 'Verlauf löschen',
    'voice.playingAudio': 'KI-Sprachausgabe läuft...',
    'voice.speechVoice': 'Gemini Sprachmodell',
    'voice.language': 'Sprache',
    'voice.chip1': 'Wo ist Bus 75 jetzt und wann kommt er an?',
    'voice.chip2': 'Gibt es Verkehrsverzögerungen auf Route 2?',
    'voice.chip3': 'Wie komme ich vom Hauptbahnhof zum Campus?',
    'voice.chip4': 'Wie lautet der Notfallkontakt und wer ist der Fahrer?',

    'world.badge': 'Globales Geonetzwerk',
    'world.title': 'Globale Flotte & Welt-Transitkarte',
    'world.subtitle': 'Interaktives hochauflösendes Netzwerk weltweiter intelligenter Universitäts-Hubs.',
    'world.zoomIn': 'Vergrößern',
    'world.zoomOut': 'Verkleinern',
    'world.resetView': 'Zurücksetzen',
    'world.sectorScan': 'Telemetrie-Scan starten',
    'world.sectorScanning': 'Scanne planetares Netz...',
    'world.hubDetails': 'Hub-Telemetrie Details',
    'world.liveFleet': 'Aktive Busse',
    'world.onTime': 'Pünktlichkeitsrate',
    'world.passengers': 'Getrackte Studenten',
    'world.jumpToCampus': 'Zum Campus-Radar',
    'world.openVoice': 'Sprachanfrage stellen',
    'world.modes': 'Visualisierungsmodus',

    'common.active': 'Aktiv',
    'common.delayed': 'Verspätet',
    'common.students': 'Studenten',
    'common.routes': 'Routen',
    'common.buses': 'Busse',
  },

  ja: {
    'nav.liveTracking': 'リアルタイム追跡',
    'nav.controlCenter': '運行管理センター',
    'nav.childTracking': '生徒位置追跡',
    'nav.myBus': 'マイバス',
    'nav.routes': '運行ルート',
    'nav.alerts': '運行アラート',
    'nav.transitAi': '交通AI & マップ',
    'nav.worldMap': 'ワールドマップ',
    'nav.overview': '概要',
    'nav.voiceChat': 'AIボイスチャット',
    'nav.role': '役割',
    'nav.signIn': 'サインイン',
    'nav.signOut': 'サインアウト',

    'voice.title': 'MyBus AIボイスアシスタント',
    'voice.subtitle': 'Gemini 3.8 Flash & Gemini TTS 搭載の高精度音声対話アシスタント。',
    'voice.listening': '聞き取り中... ご用件をお話しください',
    'voice.transcribing': 'Geminiで音声を解析中...',
    'voice.clickToSpeak': 'マイクを押して話す',
    'voice.stopListening': '話し終えたらタップ',
    'voice.inputPlaceholder': 'または質問を入力してください...',
    'voice.send': '送信',
    'voice.clearHistory': '履歴をクリア',
    'voice.playingAudio': 'AI音声を再生中...',
    'voice.speechVoice': 'Gemini音声モデル',
    'voice.language': '言語',
    'voice.chip1': 'バス75は今どこにあり、到着予定時刻は何時ですか？',
    'voice.chip2': 'OMRルートで渋滞や遅延は発生していますか？',
    'voice.chip3': '中央駅からキャンパスへの最適ルートを教えてください',
    'voice.chip4': '緊急連絡先とドライバー情報は？',

    'world.badge': 'グローバル衛星ネットワーク',
    'world.title': 'グローバル艦隊 & 世界運行マップ',
    'world.subtitle': '世界のスマートキャンパスと高速交通ハブを結ぶ高解像度運行グリッド。',
    'world.zoomIn': '拡大',
    'world.zoomOut': '縮小',
    'world.resetView': 'リセット',
    'world.sectorScan': 'セクター遠隔スキャンを実行',
    'world.sectorScanning': '運行データをスキャン中...',
    'world.hubDetails': '選択された拠点データ',
    'world.liveFleet': '稼働バス数',
    'world.onTime': '定時運行率',
    'world.passengers': '追跡中の乗客',
    'world.jumpToCampus': 'キャンパスレーダーへ',
    'world.openVoice': '音声で問い合わせ',
    'world.modes': 'ビジュアル表示',

    'common.active': '運行中',
    'common.delayed': '遅延',
    'common.students': '学生',
    'common.routes': '路線',
    'common.buses': '車両',
  },

  zh: {
    'nav.liveTracking': '实时追踪',
    'nav.controlCenter': '控制中心',
    'nav.childTracking': '子女班车追踪',
    'nav.myBus': '我的校车',
    'nav.routes': '路线网络',
    'nav.alerts': '运行警报',
    'nav.transitAi': '交通智能与地图',
    'nav.worldMap': '全球地图',
    'nav.overview': '总览',
    'nav.voiceChat': 'AI语音对话',
    'nav.role': '角色',
    'nav.signIn': '登录',
    'nav.signOut': '登出',

    'voice.title': 'MyBus 智能AI语音助手',
    'voice.subtitle': '由 Gemini 3.8 Flash 与 Gemini TTS 驱动的实时对话式语音系统。',
    'voice.listening': '正在聆听... 请说出您的问题',
    'voice.transcribing': 'Gemini 正在转录语音...',
    'voice.clickToSpeak': '点击麦克风开始说话',
    'voice.stopListening': '点击结束说话',
    'voice.inputPlaceholder': '或输入交通路线问题...',
    'voice.send': '发送',
    'voice.clearHistory': '清空对话',
    'voice.playingAudio': '正在播放AI语音回复...',
    'voice.speechVoice': 'Gemini 语音模型',
    'voice.language': '语言',
    'voice.chip1': '75号校车现在在何处，预估几分钟到达？',
    'voice.chip2': 'OMR走廊2号线上是否有交通拥堵或延误？',
    'voice.chip3': '如何从中央火车站快速到达大学主校区？',
    'voice.chip4': '紧急联络电话与当班司机信息是什么？',

    'world.badge': '自主全球空间网络',
    'world.title': '全球车队与世界交通地图',
    'world.subtitle': '连接全球智慧大学城与高速交通枢纽的交互式高清运行网格。',
    'world.zoomIn': '放大',
    'world.zoomOut': '缩小',
    'world.resetView': '重置视角',
    'world.sectorScan': '运行区域遥测扫描',
    'world.sectorScanning': '正在扫描全球网络...',
    'world.hubDetails': '所选交通枢纽遥测',
    'world.liveFleet': '运行中车队',
    'world.onTime': '准点率',
    'world.passengers': '追踪学生数',
    'world.jumpToCampus': '切换至校园雷达',
    'world.openVoice': '语音查询枢纽',
    'world.modes': '视觉图层',

    'common.active': '运行中',
    'common.delayed': '延误',
    'common.students': '学生',
    'common.routes': '路线',
    'common.buses': '车辆',
  },

  ar: {
    'nav.liveTracking': 'التتبع المباشر',
    'nav.controlCenter': 'مركز التحكم',
    'nav.childTracking': 'تتبع الأبناء',
    'nav.myBus': 'حافلتي',
    'nav.routes': 'المسارات',
    'nav.alerts': 'التنبيهات',
    'nav.transitAi': 'الذكاء الاصطناعي للنقل والخرائط',
    'nav.worldMap': 'خريطة العالم',
    'nav.overview': 'نظرة عامة',
    'nav.voiceChat': 'المحادثة الصوتية بالذكاء الاصطناعي',
    'nav.role': 'الدور',
    'nav.signIn': 'تسجيل الدخول',
    'nav.signOut': 'تسجيل الخروج',

    'voice.title': 'مساعد MyBus الصوتي الذكي',
    'voice.subtitle': 'مساعد صوتي تفاعلي يعمل بواسطة Gemini 3.8 Flash و Gemini TTS.',
    'voice.listening': 'جاري الاستماع... تحدث الآن',
    'voice.transcribing': 'جاري معالجة الصوت بواسطة Gemini...',
    'voice.clickToSpeak': 'انقر على الميكروفون للتحدث',
    'voice.stopListening': 'انقر للإنهاء',
    'voice.inputPlaceholder': 'أو اكتب استفسارك هنا...',
    'voice.send': 'إرسال',
    'voice.clearHistory': 'مسح المحادثة',
    'voice.playingAudio': 'جاري تشغيل الرد الصوتي...',
    'voice.speechVoice': 'نموذج صوت Gemini',
    'voice.language': 'اللغة',
    'voice.chip1': 'أين الحافلة 75 الآن وما هو وقت الوصول المتوقع؟',
    'voice.chip2': 'هل هناك تأخيرات مرورية على مسار OMR؟',
    'voice.chip3': 'كيف أصل إلى الحرم الجامعي من المحطة المركزية؟',
    'voice.chip4': 'ما هو رقم طوارئ النقل وسائق الحافلة؟',

    'world.badge': 'شبكة النقل الجغرافي العالمية',
    'world.title': 'الأسطول العالمي وخريطة النقل العالمية',
    'world.subtitle': 'شبكة تفاعلية فائقة الدقة تربط بين الجامعات الذكية ومراكز النقل الدولية.',
    'world.zoomIn': 'تكبير',
    'world.zoomOut': 'تصغير',
    'world.resetView': 'إعادة ضبط',
    'world.sectorScan': 'إجراء مسح النطاق عن بُعد',
    'world.sectorScanning': 'جاري مسح الشبكة...',
    'world.hubDetails': 'بيانات مركز النقل المحدد',
    'world.liveFleet': 'الحافلات النشطة',
    'world.onTime': 'معدل الالتزام بالوقت',
    'world.passengers': 'الركاب المتتبعون',
    'world.jumpToCampus': 'الانتقال لرادار الحرم الجامعي',
    'world.openVoice': 'استفسار صوتي',
    'world.modes': 'نمط الرؤية',

    'common.active': 'نشط',
    'common.delayed': 'متأخر',
    'common.students': 'الطلاب',
    'common.routes': 'المسارات',
    'common.buses': 'الحافلات',
  },
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  currentLanguageOption: LanguageOption;
  availableLanguages: LanguageOption[];
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('mybus_lang') || 'en';
  });

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('mybus_lang', lang);
  };

  const currentLanguageOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language] || translations['en'];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const defaultDict = translations['en'];
    if (defaultDict && defaultDict[key]) {
      return defaultDict[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguageOption,
        availableLanguages: SUPPORTED_LANGUAGES,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
