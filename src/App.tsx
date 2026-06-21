/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronRight, CheckCircle2, XCircle, Users, BookOpen, Compass, Activity, BrainCircuit, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

let globalAudioCtx: AudioContext | null = null;

const playSound = (type: 'click' | 'pop' | 'open') => {
  try {
    if (!globalAudioCtx) {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return;
      globalAudioCtx = new AudioContextCtor();
    }
    
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
    
    const ctx = globalAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'pop') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'open') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch(e) { console.warn('Audio play failed:', e); }
};

const QUIZ_QUESTIONS = [
  {
    id: 1,
    grade: "Conceptual",
    area: "Formación Integral",
    context: "En una reunión de área en la institución, se discute el verdadero propósito de la formación integral. Según el documento (p. 25), ¿cómo debe entenderse la formación integral?",
    options: [
      { id: 'A', text: "Como la suma fragmentada de contenidos y áreas para mejorar la eficiencia.", isCorrect: false, feedback: "La educación fragmentada y el énfasis solo en rendimiento desvirtúa la formación humana integral y desatiende el contexto (p. 23)." },
      { id: 'B', text: "Como una categoría ontológica, política y pedagógica orientada a la transformación del ser humano articulando lo personal, social y comunitario.", isCorrect: true, feedback: "¡Excelente! La formación integral supera la simple instrucción académica y busca desarrollar sujetos activos de derechos (p. 25)." },
      { id: 'C', text: "Como la incorporación exclusiva de la asignatura de ética y valores para corregir problemas de comportamiento escolar.", isCorrect: false, feedback: "La formación integral requiere articulación de dimensiones, saberes y contexto, no se limita a una sola asignatura." }
    ]
  },
  {
    id: 2,
    grade: "Dimensiones",
    area: "Socioemocional",
    context: "Un equipo docente de primaria nota que los estudiantes de 3° tienen dificultades para relacionarse pacíficamente. ¿Qué dimensión del ser, según la página 45, implica los procesos de empatía y la resolución pacífica de conflictos?",
    options: [
      { id: 'A', text: "Dimensión comunicativa y creativa.", isCorrect: false, feedback: "Aunque se relaciona, esta dimensión se enfoca en significados comunes y pensamiento lateral (p. 40)." },
      { id: 'B', text: "Dimensión ciudadana y política.", isCorrect: false, feedback: "Se vincula, pero esta trata más sobre el ejercicio crítico de los derechos y la transformación comunitaria (p. 37)." },
      { id: 'C', text: "Dimensión socioemocional.", isCorrect: true, feedback: "¡Correcto! Involucra la conciencia emocional, la empatía y hace de la escuela un espacio privilegiado para resolver conflictos pacíficamente (p. 45)." }
    ]
  },
  {
    id: 3,
    grade: "Currículo",
    area: "Principios de Organización",
    context: "Para abordar la protección ambiental del barrio, las áreas de Ciencias y Sociales deciden trabajar juntas. Según la página 60, ¿qué principio de organización curricular promueve que se integren saberes en torno a problemas comunes?",
    options: [
      { id: 'A', text: "Transversalidad.", isCorrect: true, feedback: "¡Muy bien! La transversalidad implica integrar saberes y dimensiones del ser en torno a problemas o proyectos comunes, superando la fragmentación disciplinar (p. 60)." },
      { id: 'B', text: "Armonización.", isCorrect: false, feedback: "La armonización se refiere a la capacidad de ofrecer trayectorias educativas fluidas entre ciclos, sin rupturas (p. 61)." },
      { id: 'C', text: "Flexibilidad.", isCorrect: false, feedback: "La flexibilidad permite adaptar el currículo a las necesidades y contextos, no se refiere directamente a la integración de saberes entre áreas (p. 61)." }
    ]
  },
  {
    id: 4,
    grade: "Formativa",
    area: "Evaluación",
    context: "Durante la entrega de notas, un docente desea dar un verdadero sentido formativo a la evaluación. Según los lineamientos (p. 53), ¿cuál debe ser el enfoque?",
    options: [
      { id: 'A', text: "Medir y juzgar las fallas del estudiante para que desarrolle mayor rendimiento.", isCorrect: false, feedback: "Los modelos tradicionales centrados en juzgar y calificar desvirtúan los propósitos de la evaluación formativa (p. 55)." },
      { id: 'B', text: "Acompañar la comprensión de cada estudiante desde la construcción de autorregulación y asumir el error como aprendizaje.", isCorrect: true, feedback: "¡Exacto! La evaluación formativa es una práctica reflexiva que asume el error como oportunidad de aprendizaje y promueve la autonomía (p. 53)." },
      { id: 'C', text: "Hacer un acumulado de calificaciones rigurosas solo porque es un requisito del SIEE.", isCorrect: false, feedback: "La evaluación es un proceso dialógico y situado que orienta la construcción de sentido, no un acto puramente técnico o acumulativo." }
    ]
  },
  {
    id: 5,
    grade: "Contextualización",
    area: "Planeación Pedagógica",
    context: "El colegio se propone organizar la enseñanza desde la diversidad social y cultural reconociendo los ritmos de cada estudiante (p. 61). ¿Qué estrategia es clave allí?",
    options: [
      { id: 'A', text: "Flexibilización curricular.", isCorrect: true, feedback: "¡Correcto! Es un instrumento de equidad y justicia social que busca garantizar la pertinencia considerando los contextos (p. 61)." },
      { id: 'B', text: "Estandarización de escolarización.", isCorrect: false, feedback: "Los modelos estandarizados desatienden las diversidades de los contextos y las realidades territoriales (p. 23)." },
      { id: 'C', text: "Pluralidad evaluativa individual.", isCorrect: false, feedback: "La pluralidad evaluativa es importante, pero adaptar todo el esquema de enseñanza desde la diversidad corresponde a la flexibilidad." }
    ]
  },
  {
    id: 6,
    grade: "Territorio",
    area: "PSR",
    context: "En momento de planificación, los docentes usan Problemas Socialmente Relevantes (PSR). Según la página 62, ¿cómo se concretan estos problemas en la planeación?",
    options: [
      { id: 'A', text: "Mediante preguntas problematizadoras que actúan como núcleo integrador y buscan indagación en vez de respuestas cerradas.", isCorrect: true, feedback: "¡Excelente! Estas preguntas son dispositivos que transforman el currículo hacia un proceso dinámico de indagación (p. 62)." },
      { id: 'B', text: "Usando una secuencia disciplinar cerrada paso a paso desde el libro de texto.", isCorrect: false, feedback: "El punto de partida del aprendizaje ya no es una secuencia cerrada, sino problemas reales que interpelan (p. 62)." },
      { id: 'C', text: "Asignando cuestionarios predefinidos para evaluar si se domina el vocabulario.", isCorrect: false, feedback: "Los aprendizajes demandan articulación de saberes y comprensión compleja, no solo respuestas memorísticas." }
    ]
  },
  {
    id: 7,
    grade: "Institucional",
    area: "Niveles de apropiación",
    context: "La IED ha logrado que la formación integral impregne procesos directivos, innovaciones y redes sólidas con aliados territoriales (p. 76). ¿En qué nivel de apropiación se encuentra?",
    options: [
      { id: 'A', text: "Compromiso educativo.", isCorrect: false, feedback: "Ese es el primer nivel, donde apenas se reconoce la importancia y se construyen pilotos (p. 75)." },
      { id: 'B', text: "Liderazgo distribuido.", isCorrect: false, feedback: "Es un nivel alto, pero la creación de redes y alianzas sostenibles y la integralidad como identidad corresponde al nivel máximo." },
      { id: 'C', text: "Cultura escolar.", isCorrect: true, feedback: "¡Muy bien! Se ha consolidado una comunidad educativa integral que genera redes de aprendizaje y alianzas, evidenciando impacto sostenible (p. 76)." }
    ]
  }
];

const nodesData = {
  'formacion': {
    title: 'Formación Integral',
    what: '"La formación integral como fin último de la educación es un proceso educativo centrado en el sujeto activo de derechos que se desarrolla en todos los momentos del curso de vida en múltiples dimensiones y que aprende en relación consigo mismo/a, con otros seres humanos, con otras formas de vida y con la tecnología..." (Lineamientos, p. 28).',
    how: '"A través de la integración curricular que reconoce las prácticas, políticas y experiencias, contextualizadas, flexibles e integradas que promueven capacidades, competencias y aprendizajes en diversos entornos educativos" (Lineamientos, p. 28).',
    myth: 'Mito: La formación escolar solo se enfoca en lo cognitivo. Realidad: "La formación integral se configura como un proceso multidimensional que reconoce al sujeto activo de derechos en interacción consigo mismo/a, con otros seres humanos, con otras formas de vida y con las tecnologías" (Lineamientos, p. 27).',
    subs: []
  },
  'dimensiones': {
    title: '9 Dimensiones del Desarrollo',
    what: '"Las dimensiones del ser constituyen los ámbitos fundamentales en los que se despliega la experiencia humana y, por lo tanto, orientan la práctica educativa hacia el desarrollo integral de cada estudiante" (p. 36).',
    how: '"En la planificación microcurricular, el equipo docente debe declarar de forma explícita qué dimensiones se están intencionando. El aula es el microcosmos donde estas dimensiones interactúan a través de experiencias de aprendizaje auténticas" (Manual Docente, p. 15).',
    myth: 'Mito: Hay que evaluar todas las dimensiones mediante rúbricas en cada clase. Realidad: "Las dimensiones se cultivan procesualmente y se priorizan de acuerdo a la naturaleza del proyecto y la etapa del desarrollo del estudiante" (Guía de Evaluación, p. 9).',
    subs: [
        { name: 'Ambiental', desc: '"Educación para la sostenibilidad y el cuidado del planeta se orienta a formar ciudadanos y ciudadanas conscientes de su interdependencia con la biodiversidad y comprometidos/as con la construcción de un futuro ambientalmente sostenible" (p. 36).' },
        { name: 'Ciudadana y Política', desc: '"El saber de la ciudadanía y las competencias que involucra deben ser abordados como un campo crítico y controversial, que se construye a partir del diálogo, el intercambio de ideas, el respeto a las diferencias, la deliberación..." (p. 37).' },
        { name: 'Cognitiva', desc: '"La dimensión cognitiva supera la idea de transmitir contenidos y conceptos. Reconoce que el pensamiento es una forma esencial de presencia en el mundo y una condición para la construcción de la identidad, la comprensión de la realidad..." (p. 39).' },
        { name: 'Comunicativa y Creativa', desc: '"Esta dimensión constituye un elemento fundamental de la formación integral, donde la interacción humana y la capacidad de invención convergen para permitir que el sujeto habite, comprenda y transforme su realidad" (p. 40).' },
        { name: 'Corporal', desc: '"Esta dimensión comprende la relación consciente, saludable y expresiva de la persona con su propio cuerpo, no solo como una realidad biológica, sino también como un territorio de identidad, experiencia y sentido" (p. 41).' },
        { name: 'Cultural', desc: '"En un país como Colombia, la dimensión cultural del ser es entendida como el tejido de significados, valores, prácticas, creaciones y conocimientos que una persona interioriza, transforma y produce a lo largo de su vida..." (p. 42).' },
        { name: 'Ética', desc: '"La dimensión ética reconoce que la formación de los seres humanos implica la construcción de criterios para orientar la acción y convivir con otras personas con fundamento en el respeto, la justicia y la responsabilidad" (p. 42).' },
        { name: 'Histórica y de Memoria (PSR)', desc: '"La dimensión histórica y de memoria histórica se define como la capacidad de pensar históricamente para comprender el presente y agenciar el futuro. Más allá de la erudición académica, esta dimensión propone una ontología del presente..." (p. 43).' },
        { name: 'Socioemocional', desc: '"Esta dimensión involucra un conjunto de habilidades, actitudes, conocimientos y comportamientos que ayudan a las personas a reconocer y generar interacciones de cuidado y bienestar consigo mismo/a, con los demás y con el entorno" (p. 44).' }
    ]
  },
  'principios': {
    title: 'Principios Curriculares',
    what: '"La concreción de las propuestas curriculares está asociada, entre otras variables, a cuatro principios fundamentales: coherencia, transversalidad, flexibilidad y armonización" (Lineamientos, p. 60).',
    how: '"Estos cuatro principios actú­an en conjunto para consolidar propuestas como instrumentos vivos, posibilitando la incorporación de la formación integral a las dinámicas escolares e institucionales" (Lineamientos, p. 61).',
    myth: 'Mito: El currículo es una lista estática de temas. Realidad: "El aprendizaje adquiere sentido cuando se organiza alrededor de situaciones significativas que exigen la movilización articulada de distintos saberes" (Lineamientos, p. 62).',
    subs: [
        { name: 'Coherencia', desc: '"Orienta la articulación entre los fines de la educación, las competencias... las estrategias didácticas empleadas y la evaluación, evitando contradicciones" (p. 60).' },
        { name: 'Transversalidad', desc: '"Implica integrar saberes y dimensiones del ser en torno a problemas o proyectos comunes, superando la fragmentación disciplinar" (p. 60).' },
        { name: 'Flexibilidad', desc: '"Permite adaptar el currículo a las potencialidades y necesidades de los y las estudiantes, los contextos territoriales y culturales..." (p. 61).' },
        { name: 'Armonización', desc: '"Se refiere a la capacidad del currículo para ofrecer trayectorias educativas fluidas, sin rupturas abruptas o cambios descontextualizados" (p. 61).' }
    ]
  },
  'itinerario': {
    title: 'Itinerario y PSR',
    what: 'Un itinerario para el diseño de prácticas educativas. "La comprensión y la reflexión pedagógica desde la formación integral es una práctica que se materializa en el aula de clases... implica reconocer al/a la estudiante en todas sus dimensiones y situarlo/a en relación con su territorio" (p. 78).',
    how: 'A través de 4 momentos reflexivos: Comprensión del sujeto, Definición del Problema Social Relevante (PSR), Planeación pedagógica y didáctica, y Acción educativa (p. 79-82).',
    myth: 'Mito: Los temas dirigen el aprendizaje. Realidad: "El punto de partida del aprendizaje ya no es una secuencia disciplinar cerrada, sino los problemas reales [PSR] que interpelan a las y los estudiantes en sus territorios" (p. 62).',
    subs: [
        { name: 'Momento 1: Sujeto', desc: '"La escuela debe conocer y reconocer las particularidades del entorno... es necesario leer el territorio y comprenderlo desde una perspectiva geográfica y sociocultural" (p. 79).' },
        { name: 'Momento 2: PSR', desc: '"Los Problemas Sociales Relevantes (PSR) son conflictos públicos, complejos y controversiales que afectan de manera directa la vida de las comunidades. Trabajar con estos implica formar para interpretar críticamente la realidad..." (p. 62, 80).' },
        { name: 'Momento 3: Planeación', desc: '"Impide que lo cotidiano se automatice... se establecen mecanismos de diálogo para la planeación curricular de una estrategia pedagógica, formulación de preguntas problematizadoras" (p. 81).' },
        { name: 'Momento 4: Acción', desc: '"Las decisiones prácticas atienden al ejercicio cíclico de comprensión y reflexión... un diálogo permanente entre docentes, liderazgos pedagógicos y la familia se hace partícipe" (p. 82).' }
    ]
  },
  'evaluacion': {
    title: 'Evaluación Formativa',
    what: '"La evaluación, entendida desde la perspectiva de la formación integral, trasciende la medición de logros cognitivos. Se orienta hacia la comprensión del proceso formativo del sujeto en todas sus dimensiones" (Lineamientos, p. 53).',
    how: '"Implica transitar de un paradigma que pone el énfasis en la calificación, hacia un enfoque procesual y transformador. Esto requiere una cultura evaluativa basada en la retroalimentación, el error... y la autonomía" (Lineamientos, p. 53).',
    myth: 'Mito: La evaluación es un castigo. Realidad: "La evaluación deja de ser un instrumento de control y se convierte en una práctica reflexiva, dialógica y emancipadora... evaluar también es formar para la autonomía" (Lineamientos, p. 53).',
    subs: [
        { name: 'Autoevaluación', desc: '"Fomenta la capacidad del/de la estudiante para reflexionar sobre sus procesos, identificar logros y plantear metas... los criterios deben ser claros" (p. 57).' },
        { name: 'Coevaluación', desc: '"Permite desarrollar habilidades de diálogo, escucha activa y argumentación. La evaluación colaborativa potencia la comprensión" (p. 57).' },
        { name: 'Heteroevaluación', desc: '"El rol del/de la docente como mediador/a implica interpretar evidencias, ofrecer retroalimentación oportuna y diseñar experiencias que fortalezcan la comprensión" (p. 57).' },
        { name: 'Retroalimentación', desc: '"Constituye un acto pedagógico y ético. Debe ser clara, específica, orientada a la mejora y sensible al proceso de cada estudiante" (p. 57).' }
    ]
  }
};

const categoryLayout = {
  'dimensiones': { top: '35%', left: '35%', angles: [-110, -80, -50, -20, 10, 40, 70, 100, 130] },
  'principios': { top: '35%', left: '65%', angles: [-90, -45, 0, 45] },
  'itinerario': { top: '65%', left: '65%', angles: [-45, 0, 45, 90] },
  'evaluacion': { top: '65%', left: '35%', angles: [90, 135, 180, 225] },
};

const renderIcon = (key: string) => {
   switch (key) {
      case 'dimensiones': return <Users size={24} className="mb-1 text-emerald-200 drop-shadow-md z-10" />;
      case 'principios': return <BookOpen size={24} className="mb-1 text-emerald-200 drop-shadow-md z-10" />;
      case 'itinerario': return <Compass size={24} className="mb-1 text-emerald-200 drop-shadow-md z-10" />;
      case 'evaluacion': return <Activity size={24} className="mb-1 text-emerald-200 drop-shadow-md z-10" />;
      case 'formacion': return <BrainCircuit size={32} className="mb-1 text-[#422006] drop-shadow-md z-10" />;
      default: return null;
   }
};

const SchoolLogo = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative w-16 h-16 shrink-0 rounded-full bg-white drop-shadow-lg flex items-center justify-center">
      {!imgError && (
        <img 
          src="/logo.png" 
          alt="Colegio Gustavo Restrepo Logo" 
          className="w-full h-full object-contain rounded-full p-0.5" 
          onError={() => setImgError(true)}
        />
      )}
      {imgError && (
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="#ffffff" />
          <path d="M 2,50 A 48 48 0 0 1 98,50" fill="none" stroke="#facc15" strokeWidth="4" />
          <path d="M 2,50 A 48 48 0 0 0 98,50" fill="none" stroke="#dc2626" strokeWidth="4" />
          <circle cx="50" cy="50" r="32" fill="#004d26" />
          <path id="top-arc" d="M 12,50 A 38 38 0 0 1 88,50" fill="none" />
          <path id="bottom-arc" d="M 16,50 A 34 34 0 0 0 84,50" fill="none" />
          <text fontSize="7" fontWeight="900" fill="#000" textAnchor="middle" letterSpacing="0.2">
            <textPath href="#top-arc" startOffset="50%">COLEGIO GUSTAVO RESTREPO</textPath>
          </text>
          <text fontSize="4.5" fontStyle="italic" fontWeight="600" fill="#000" textAnchor="middle" letterSpacing="0">
            <textPath href="#bottom-arc" startOffset="50%">Institución Educativa Distrital</textPath>
          </text>
          <text x="50" y="55" fill="#ffffff" fontSize="24" fontWeight="900" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" letterSpacing="1">CGR</text>
        </svg>
      )}
    </div>
  );
};

export default function App() {
  const [selectedNode, setSelectedNode] = useState<keyof typeof nodesData>('formacion');
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState<typeof QUIZ_QUESTIONS>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 5);
    setCurrentQuizQuestions(shuffled);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeData = nodesData[selectedNode];

  const handleNodeClick = (id: keyof typeof nodesData) => {
    playSound('click');
    setSelectedNode(id);
    setSelectedSub(null);
  };

  const handleQuizOpen = () => {
    playSound('open');
    const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 5);
    setCurrentQuizQuestions(shuffled);
    setShowQuiz(true);
    setCurrentQuizIndex(0);
    setQuizSelectedOption(null);
    setQuizFinished(false);
  };

  const handleQuizOptionSelect = (optionId: string) => {
    playSound('click');
    setQuizSelectedOption(optionId);
  };

  const handleNextQuizQuestion = () => {
    playSound('pop');
    if (currentQuizIndex < currentQuizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setQuizSelectedOption(null);
    } else {
      setQuizFinished(true);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex justify-center text-gray-900 font-sans p-0 md:p-4 lg:py-8 overflow-y-auto">
      <div className="relative w-full max-w-[1024px] flex flex-col bg-white overflow-visible select-none rounded-none md:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-gray-200">
        
        {/* Header Section */}
        <header className="h-auto md:h-20 py-4 md:py-0 flex flex-col md:flex-row md:items-center justify-between px-6 bg-[#004d26] text-white border-b-4 border-yellow-400 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <SchoolLogo />
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase leading-none drop-shadow-sm">Transformación Curricular</h1>
              <p className="text-xs text-yellow-400 font-medium tracking-wide mt-1">Colegio Gustavo Restrepo IED • Bogotá</p>
            </div>
          </div>
          <div className="text-right px-4 border-l border-white/20 hidden sm:block">
            <div className="text-[10px] uppercase tracking-widest text-white/60">Enfoque 2024-2026</div>
            <div className="text-sm font-black text-yellow-300 drop-shadow-sm">EVALUACIÓN Y PROCESOS</div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col md:flex-row relative bg-white">
          {/* Interactive Canvas Area (Left/Top) */}
          <section className="w-full md:w-[60%] lg:w-[65%] aspect-square md:aspect-auto md:min-h-[500px] relative bg-[#001509] overflow-hidden flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 shadow-inner">
            {/* Dynamic Background */}
            <motion.div 
              animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#005a2e_0%,_transparent_70%)]"
            />
            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.03)_2px,transparent_2px)] bg-[size:60px_60px] opacity-70"></div>
            
            {/* Nodes Container */}
            <div className="absolute inset-0 w-full h-full">
              
              {/* Reliable SVG Connection Lines from Center */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                {Object.entries(categoryLayout).map(([key, pos]) => {
                   const isSelected = selectedNode === key || selectedNode === 'formacion';
                   return (
                     <line 
                       key={`line-${key}`} 
                       x1="50%" y1="50%" 
                       x2={pos.left} y2={pos.top} 
                       stroke={isSelected ? "#facc15" : "rgba(16, 185, 129, 0.3)"} 
                       strokeWidth={selectedNode === key ? "3" : isSelected ? "2" : "1.5"} 
                       filter={isSelected ? "url(#glow)" : ""}
                       strokeDasharray="6 6"
                       className={`transition-all duration-500 ${isSelected ? 'animate-[dash_1s_linear_infinite]' : ''}`}
                     />
                   )
                })}
              </svg>
              <style dangerouslySetInnerHTML={{__html:`@keyframes dash { to { stroke-dashoffset: -12; } }`}} />

              {/* Category Nodes */}
              {Object.entries(categoryLayout).map(([key, pos]) => {
                const isSelected = selectedNode === key;
                const nodeKey = key as keyof typeof categoryLayout;
                const data = nodesData[nodeKey];
                
                return (
                  <div key={key} className={`absolute w-0 h-0 ${isSelected ? 'z-40' : 'z-10'}`} style={{ top: pos.top, left: pos.left }}>
                    
                    {/* Subcategories Burst */}
                    <AnimatePresence>
                      {isSelected && data.subs?.map((subObj, i) => {
                        const sub = subObj.name;
                        const ang = pos.angles[i];
                        const baseR = windowWidth < 640 ? 40 : windowWidth < 1024 ? 65 : 85; 
                        const offsetR = windowWidth < 640 ? 25 : windowWidth < 1024 ? 45 : 60;
                        const r = i % 2 === 0 ? baseR : offsetR; 
                        const isSubSelected = selectedSub === sub;
                        return (
                          <div key={sub} className="absolute inset-0 overflow-visible" style={{ pointerEvents: 'none' }}>
                            {/* Connective Ray */}
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: r }}
                              exit={{ width: 0 }}
                              transition={{ type: 'spring', damping: 20, stiffness: 100, delay: i * 0.05 }}
                              className="absolute top-0 left-0 h-[2px] opacity-60 origin-left"
                              style={{
                                background: 'linear-gradient(90deg, #facc15 0%, transparent 100%)',
                                transform: `translateY(-50%) rotate(${ang}deg)`
                              }}
                            />
                            {/* Label */}
                            <motion.div
                               initial={{ opacity: 0, scale: 0 }}
                               animate={{ opacity: 1, scale: isSubSelected ? 1.05 : 1 }}
                               exit={{ opacity: 0, scale: 0 }}
                               transition={{ type: 'spring', damping: 15, stiffness: 120, delay: i * 0.05 + 0.1 }}
                               className={`absolute pointer-events-auto flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 ${isSubSelected ? 'z-50' : 'z-30'}`}
                               style={{
                                  left: Math.cos(ang * Math.PI / 180) * r,
                                  top: Math.sin(ang * Math.PI / 180) * r
                               }}
                            >
                               <div 
                                 onClick={(e) => { e.stopPropagation(); playSound('click'); setSelectedSub(sub); }}
                                 title={sub}
                                 className={`px-2 py-1.5 rounded-2xl border text-[9px] font-black tracking-wide uppercase transition-all cursor-pointer whitespace-normal text-center flex items-center justify-center leading-tight break-words ${isSubSelected ? 'w-24 z-50 scale-110' : 'w-20'} shadow-md`}
                                 style={{
                                     background: isSubSelected ? 'radial-gradient(circle at 30% 30%, #fef08a 0%, #eab308 20%, #a16207 60%, #422006 100%)' : 'radial-gradient(circle at 30% 30%, #004d26 0%, #002813 60%, #000000 100%)',
                                     color: isSubSelected ? '#2f1a04' : '#facc15',
                                     borderColor: isSubSelected ? 'rgba(255,255,255,0.4)' : 'rgba(250,204,21,0.5)',
                                     boxShadow: isSubSelected 
                                       ? 'inset -5px -5px 10px rgba(0,0,0,0.5), inset 5px 5px 10px rgba(255,255,255,0.4), 0 0 30px rgba(250,204,21,0.6), 0 5px 15px rgba(0,0,0,0.5)'
                                       : 'inset -3px -3px 6px rgba(0,0,0,0.6), inset 3px 3px 6px rgba(255,255,255,0.2), 0 10px 20px rgba(0,0,0,0.6)'
                                 }}
                               >
                                 {sub}
                               </div>
                            </motion.div>
                          </div>
                        )
                      })}
                    </AnimatePresence>

                    {/* Node Sphere with floating animation */}
                    <motion.div 
                      animate={{ y: [-4, 4, -4] }}
                      transition={{ duration: 4 + Math.random()*2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                      onClick={() => handleNodeClick(nodeKey)}
                    >
                      {/* Selection Glow Indicator */}
                      {isSelected && (
                        <motion.div 
                          animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.7, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          className="absolute inset-0 rounded-full bg-yellow-400 blur-2xl z-0 pointer-events-none"
                        />
                      )}
                      
                      <div 
                        className={`relative w-[100px] h-[100px] rounded-full flex flex-col items-center justify-center text-center p-2 font-bold transition-all duration-300 z-10 border border-black/30 group-hover:scale-110 ${isSelected ? 'scale-110' : ''}`}
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, #34d399 0%, #059669 25%, #064e3b 60%, #022c22 100%)',
                          boxShadow: isSelected 
                            ? 'inset -8px -8px 16px rgba(0,0,0,0.6), inset 8px 8px 16px rgba(255,255,255,0.3), 0 0 30px rgba(250, 204, 21, 0.6), 0 0 0 4px rgba(250, 204, 21, 0.4)'
                            : 'inset -6px -6px 12px rgba(0,0,0,0.6), inset 6px 6px 12px rgba(255,255,255,0.2), 0 10px 20px rgba(0,0,0,0.5)'
                        }}
                      >
                        {renderIcon(nodeKey)}
                        <span className="text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] text-[9px] leading-tight px-1 z-10">
                          {data.title}
                        </span>
                      </div>
                    </motion.div>

                  </div>
                )
              })}

              {/* Core Node (Center) */}
              <div className="absolute top-1/2 left-1/2 z-30 transform -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  onClick={() => handleNodeClick('formacion')}
                  className="relative group cursor-pointer"
                >
                  {/* Selection Glow Indicator */}
                  {selectedNode === 'formacion' && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full bg-yellow-400 blur-3xl z-0 pointer-events-none"
                    />
                  )}
                  <div 
                    className={`relative w-[130px] h-[130px] rounded-full flex flex-col items-center justify-center text-center p-3 font-black transition-all duration-300 border border-yellow-200/30 group-hover:scale-105 z-10 ${selectedNode === 'formacion' ? 'scale-110' : ''}`}
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, #fef08a 0%, #eab308 20%, #a16207 60%, #422006 100%)',
                      boxShadow: selectedNode === 'formacion'
                        ? 'inset -12px -12px 24px rgba(0,0,0,0.6), inset 12px 12px 24px rgba(255,255,255,0.4), 0 0 50px rgba(255, 215, 0, 0.6), 0 0 0 6px rgba(255, 255, 255, 0.2)'
                        : 'inset -10px -10px 20px rgba(0,0,0,0.6), inset 10px 10px 20px rgba(255,255,255,0.3), 0 20px 40px rgba(0,0,0,0.7)'
                    }}
                  >
                    {renderIcon('formacion')}
                    <span className="text-[#2f1a04] drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)] text-[11px] leading-snug tracking-wide z-10 mt-1">
                      FORMACIÓN<br/>INTEGRAL
                    </span>
                  </div>
                </motion.div>
              </div>

            </div>
          </section>

          {/* Information Panel (Right/Bottom) */}
          <aside className="w-full md:w-[40%] lg:w-[35%] flex-none bg-[#fafafa] text-gray-900 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col relative z-20">
            <div className="p-6 flex-1 overflow-y-auto min-h-[300px] lg:min-h-0">
              <AnimatePresence mode="wait">
                {selectedSub ? (
                    <motion.div 
                      key={`sub-${selectedSub}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <button onClick={() => setSelectedSub(null)} className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-[#004d26] hover:text-[#002f18] bg-green-50 px-4 py-2 rounded-full border border-green-200 transition-colors shadow-sm">
                          ← Volver a {activeData.title}
                      </button>
                      <div className="mb-4 block">
                          <span className="px-4 py-1.5 bg-yellow-400 text-[#004d26] text-xs font-black rounded-sm uppercase tracking-widest shadow-sm">
                              Subcategoría
                          </span>
                      </div>
                      <h2 className="text-3xl font-black text-[#004d26] mb-6 leading-tight">{selectedSub}</h2>
                      
                      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#004d26]"></div>
                          <h3 className="text-sm font-bold text-[#004d26] uppercase tracking-wider mb-3 flex items-center gap-2">
                              Detalle
                          </h3>
                          <p className="text-base leading-relaxed text-gray-800 font-medium">
                              {activeData.subs?.find(s => s.name === selectedSub)?.desc}
                          </p>
                      </section>
                    </motion.div>
                ) : (
                  <motion.div 
                    key={selectedNode}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-4 inline-block px-4 py-1.5 bg-[#004d26] text-white text-xs font-bold rounded-sm uppercase tracking-widest shadow-md">
                      {selectedNode === 'formacion' ? 'Eje Central' : 'Categoría'}
                    </div>
                    <h2 className="text-3xl font-black text-[#004d26] mb-6 leading-tight">{activeData.title}</h2>
                    
                    <div className="space-y-6 text-base">
                      <section>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span> Qué es
                        </h3>
                        <p className="leading-relaxed text-gray-700 italic">
                          {activeData.what}
                        </p>
                      </section>
                      
                      {activeData.subs && activeData.subs.length > 0 && (
                        <section>
                          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span> Elementos Clave
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {activeData.subs.map(subObj => (
                              <button 
                                key={subObj.name} 
                                onClick={() => setSelectedSub(subObj.name)}
                                className={`px-4 py-2 border text-xs font-bold rounded-full shadow-sm uppercase tracking-wider transition-colors ${
                                  selectedSub === subObj.name ? 'bg-yellow-400 text-[#004d26] border-yellow-500 hover:bg-yellow-300' : 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                                }`}
                              >
                                {subObj.name}
                              </button>
                            ))}
                          </div>
                        </section>
                      )}
  
                      <section className="p-5 bg-green-50 rounded-lg border border-green-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#004d26]"></div>
                        <h3 className="text-sm font-bold text-[#004d26] uppercase tracking-wider mb-2">Despliegue en Aula</h3>
                        <p className="leading-relaxed text-gray-800" dangerouslySetInnerHTML={{ __html: activeData.how }} />
                      </section>
  
                      <section className="p-5 bg-red-50/80 rounded-lg border border-red-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                        <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-2">Rompamos el mito</h3>
                        <p className="text-gray-800 font-medium">
                          {activeData.myth}
                        </p>
                      </section>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="p-5 bg-white border-t border-gray-200 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
              <button 
                onClick={() => {
                   playSound('click');
                   const keys = Object.keys(nodesData);
                   const idx = keys.indexOf(selectedNode);
                   handleNodeClick(keys[(idx + 1) % keys.length] as any);
                }}
                className="w-full py-3 bg-[#004d26] text-white font-bold rounded-lg hover:bg-[#00381b] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>Explorar Siguiente</span>
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>
          </aside>
        </main>

        {/* Quiz / Evaluación Docente Section (Bottom) */}
        <section id="evaluacion" className="shrink-0 bg-gray-900 border-t-8 border-yellow-400 p-6 md:p-10 flex flex-col md:flex-row gap-8 shrink-0 z-30 relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-yellow-200 to-yellow-500 opacity-50"></div>
          
          <div className="flex-none w-full md:w-48 flex flex-col justify-center items-center bg-[#004d26] rounded-2xl text-center p-6 shadow-inner border border-white/5">
            <div className="text-yellow-400 font-black text-3xl md:text-3xl uppercase tracking-tighter shadow-sm w-full drop-shadow-md break-words leading-tight">Evaluación</div>
            <div className="text-white font-bold text-sm md:text-base uppercase tracking-widest mt-2">Docente</div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center min-h-[300px]">
            {currentQuizQuestions.length > 0 && !quizFinished ? (
              <AnimatePresence mode="wait">
                <motion.div 
                  key={`quiz-footer-${currentQuizIndex}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full flex-1 flex flex-col xl:flex-row gap-8"
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-xs text-yellow-400 uppercase font-black tracking-widest bg-yellow-400/10 px-3 py-1 rounded-full">
                         Pregunta {currentQuizIndex + 1} de {currentQuizQuestions.length} • {currentQuizQuestions[currentQuizIndex].grade}
                       </span>
                       <div className="flex gap-2">
                         {currentQuizQuestions.map((_, i) => (
                           <div key={i} className={`w-2 h-2 rounded-full ${i <= currentQuizIndex ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'bg-white/20'}`}></div>
                         ))}
                       </div>
                    </div>
                    <p className="text-base md:text-lg text-white mb-6 font-medium leading-relaxed">
                      {currentQuizQuestions[currentQuizIndex].context}
                    </p>
                  </div>
                  
                  <div className="flex-[1.5] flex flex-col gap-4">
                    {currentQuizQuestions[currentQuizIndex].options.map(option => {
                      const isSelected = quizSelectedOption === option.id;
                      const isCorrect = option.isCorrect;
                      let btnClass = "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300";
                      
                      if (isSelected) {
                        btnClass = isCorrect ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'bg-red-500/20 border-red-500/50 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]';
                      } else if (quizSelectedOption) {
                        btnClass = "bg-white/5 border-white/5 opacity-40 cursor-not-allowed";
                      }

                      return (
                        <button 
                          key={option.id}
                          disabled={!!quizSelectedOption}
                          onClick={() => !quizSelectedOption && handleQuizOptionSelect(option.id)}
                          className={`flex-1 p-4 md:p-5 rounded-xl border text-sm md:text-base leading-snug text-left transition-all ${btnClass}`}
                        >
                          <div className="flex items-start gap-4">
                            <span className={`font-black text-xl ${isSelected ? (isCorrect ? 'text-emerald-400' : 'text-red-400') : 'text-yellow-400'}`}>{option.id}.</span> 
                            <span className="mt-0.5">{option.text}</span>
                            {isSelected && isCorrect && <CheckCircle2 size={24} className="text-emerald-400 shrink-0 ml-auto" />}
                            {isSelected && !isCorrect && <XCircle size={24} className="text-red-400 shrink-0 ml-auto" />}
                          </div>
                        </button>
                      );
                    })}
                    
                    {/* Feedback row */}
                    {quizSelectedOption && (
                       <motion.div 
                         initial={{ opacity: 0, height: 0 }} 
                         animate={{ opacity: 1, height: 'auto'}} 
                         className="mt-2"
                       >
                         {currentQuizQuestions[currentQuizIndex].options.map(opt => {
                           if (opt.id !== quizSelectedOption) return null;
                           return (
                             <div key="feedback" className={`p-4 md:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border ${opt.isCorrect ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100' : 'bg-red-500/20 border-red-500/30 text-red-100'}`}>
                               <p className="text-sm md:text-base font-medium leading-relaxed">{opt.feedback}</p>
                               {opt.isCorrect ? (
                                 <button onClick={handleNextQuizQuestion} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-sm uppercase tracking-wider shrink-0 transition-all shadow-md w-full sm:w-auto">
                                   {currentQuizIndex < currentQuizQuestions.length - 1 ? 'Siguiente' : 'Finalizar'}
                                 </button>
                               ) : (
                                 <button onClick={() => setQuizSelectedOption(null)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-black rounded-lg text-sm uppercase tracking-wider shrink-0 transition-all shadow-sm w-full sm:w-auto">
                                   Reintentar
                                 </button>
                               )}
                             </div>
                           )
                         })}
                       </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8 h-full">
                 <div className="w-20 h-20 bg-[#004d26]/50 rounded-full flex items-center justify-center mb-6 border border-emerald-400/20 shadow-inner">
                   <BrainCircuit size={40} className="text-emerald-400" />
                 </div>
                 <h2 className="text-3xl font-black text-yellow-400 uppercase mb-4">¡Evaluación Completada!</h2>
                 <p className="text-base md:text-lg text-gray-300 font-medium mb-8 max-w-2xl">
                   Has demostrado comprender los principios de flexibilización y contextualización que nos exigen los nuevos lineamientos de formación integral.
                 </p>
                 <button onClick={handleQuizOpen} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                   Nuevo Intento
                 </button>
              </div>
            )}
          </div>
        </section>

        {/* Watermark Signature */}
        <div className="absolute bottom-4 right-5 text-right pointer-events-none opacity-40 z-40 hidden md:block">
          <p className="text-[10px] leading-tight font-sans text-gray-400 uppercase tracking-widest">
            <span className="font-bold text-gray-300">Augusto Colorado Castro</span><br/>
            Docente Decolonial<br/>
            Laboratorio de Medios ®
          </p>
        </div>

      </div>
    </div>
  );
}

