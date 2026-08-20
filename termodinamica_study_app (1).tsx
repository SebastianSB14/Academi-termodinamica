import React, { useState, useMemo, useEffect } from 'react';

const TermoApp = () => {
    const [selectedCorte, setSelectedCorte] = useState(1);
    const [selectedTopic, setSelectedTopic] = useState(null);
    
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState("");
    const [userQuestion, setUserQuestion] = useState("");
    const [activeAiTab, setActiveAiTab] = useState('chat'); // 'chat' or 'quiz'

    // Thermodynamic Calculator State
    const [calcFluid, setCalcFluid] = useState('Water');
    const [calcProp1Type, setCalcProp1Type] = useState('T');
    const [calcProp1Value, setCalcProp1Value] = useState(300); // 300 K
    const [calcProp2Type, setCalcProp2Type] = useState('P');
    const [calcProp2Value, setCalcProp2Value] = useState(101325); // 1 atm in Pa
    const [calcOutputProp, setCalcOutputProp] = useState('H');
    const [calcResult, setCalcResult] = useState(null);
    const [calcLoading, setCalcLoading] = useState(false);
    const [calcError, setCalcError] = useState("");

    // Reset AI state when topic changes
    useEffect(() => {
        setAiResponse("");
        setUserQuestion("");
    }, [selectedTopic]);

    const handleAskAI = async (type) => {
        if (type === 'chat' && !userQuestion.trim()) return;
        
        setAiLoading(true);
        setAiResponse("");
        setActiveAiTab(type);

        const apiKey = ""; // API key is injected by the environment
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

        const systemPrompt = "Eres un profesor universitario experto en Termodinámica Aplicada. Responde de forma clara, precisa y pedagógica. Formatea tu respuesta usando saltos de línea claros. No uses markdown complejo que no pueda ser renderizado como texto plano, usa viñetas simples (- o *).";
        
        const currentTopic = currentCorteData.topics.find(t => t.id === selectedTopic) || currentCorteData.topics[0];
        
        let prompt = "";
        if (type === 'quiz') {
            prompt = `Genera un quiz rápido de 3 preguntas de opción múltiple para evaluar la comprensión del estudiante sobre el siguiente tema de termodinámica. Basa tus preguntas ESTRICTAMENTE en el contenido provisto. Al final del quiz, incluye las respuestas correctas con una muy breve justificación.\n\nTema: ${currentTopic.title}\nContenido: ${currentTopic.content}`;
        } else {
            prompt = `Responde la siguiente pregunta del estudiante basándote en el tema actual. Si la pregunta se desvía drásticamente de la termodinámica, redirige al estudiante de vuelta al tema amablemente.\n\nTema actual: ${currentTopic.title}\nContenido de referencia: ${currentTopic.content}\n\nPregunta del estudiante: ${userQuestion}`;
        }

        try {
            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 && result.candidates[0]?.content?.parts?.[0]?.text) {
                setAiResponse(result.candidates[0].content.parts[0].text);
            } else {
                setAiResponse("Hubo un error al procesar la respuesta o la API no devolvió contenido válido.");
            }
        } catch (error) {
            console.error(error);
            setAiResponse("Error de red al conectar con el tutor AI. Por favor, intenta de nuevo.");
        }
        
        if (type === 'chat') setUserQuestion("");
        setAiLoading(false);
    };

    // Simulated CoolProp API Call
    // In a production environment, this would call a real backend (e.g., Python/Node server wrapping CoolProp)
    // or use the emscripten-compiled coolprop.js/coolprop.wasm directly in the browser.
    const handleCalculateProperty = async () => {
        setCalcLoading(true);
        setCalcError("");
        setCalcResult(null);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            // This is a SIMULATION for educational purposes since a full WASM CoolProp 
            // implementation requires external files not supported in this single-file React environment.
            // We mock common queries based on typical Rankine/Psychrometrics problems.
            
            let resultValue = 0;
            let unit = "";

            if (calcFluid === 'Water') {
                if (calcOutputProp === 'H') {
                    // Very rough mock for Enthalpy of water
                    resultValue = (parseFloat(calcProp1Value) * 4.18) + (parseFloat(calcProp2Value) / 10000); 
                    unit = "kJ/kg";
                } else if (calcOutputProp === 'S') {
                    resultValue = (parseFloat(calcProp1Value) * 0.015);
                    unit = "kJ/(kg·K)";
                } else if (calcOutputProp === 'D') {
                    resultValue = 997 - (parseFloat(calcProp1Value) - 300)*0.2;
                    unit = "kg/m³";
                }
            } else if (calcFluid === 'Air') {
                if (calcOutputProp === 'H') {
                    resultValue = parseFloat(calcProp1Value) * 1.005; // Cp * T
                    unit = "kJ/kg";
                }
            } else {
                throw new Error("Fluido simulado no disponible. (Mock data only)");
            }

            setCalcResult(`${resultValue.toFixed(2)} ${unit}`);

        } catch (err) {
            setCalcError(err.message || "Error al calcular la propiedad.");
        } finally {
            setCalcLoading(false);
        }
    };

    // Syllabus Data based on the provided PDF
    const syllabusData = {
        1: {
            title: "Primer Corte: Conceptos Básicos y Exergía",
            date: "26 de septiembre",
            topics: [
                {
                    id: "repaso",
                    title: "Repaso de Termodinámica",
                    content: `
                        <h3 class="text-lg font-bold mb-2 text-blue-800">1. Conceptos Básicos</h3>
                        <p class="mb-2"><strong>Sistemas y Volúmenes de Control:</strong> Un sistema es una cantidad de materia o una región en el espacio elegida para estudio. Un sistema cerrado (masa de control) tiene masa fija, mientras que un sistema abierto (volumen de control) permite el flujo de masa a través de sus fronteras.</p>
                        <p class="mb-2"><strong>Propiedades:</strong> Las intensivas (temperatura, presión) no dependen de la masa. Las extensivas (volumen total, energía total) sí. Las propiedades específicas (volumen específico) son propiedades extensivas por unidad de masa.</p>
                        <p class="mb-4"><strong>Estado y Equilibrio:</strong> El Postulado de Estado establece que el estado de un sistema compresible simple se especifica por dos propiedades intensivas independientes.</p>

                        <h3 class="text-lg font-bold mb-2 text-blue-800">2. Primera Ley (Conservación de la Energía)</h3>
                        <p class="mb-2">La energía no se crea ni se destruye, solo se transforma. Para un ciclo cerrado, el trabajo neto realizado es igual al calor neto transferido.</p>
                        <p class="mb-4">Para un volumen de control en flujo estacionario (turbinas, bombas, compresores), la tasa de energía que entra es igual a la tasa de energía que sale: <br> <span class="font-mono text-sm bg-gray-100 p-1 rounded">E_in = E_out</span></p>

                        <h3 class="text-lg font-bold mb-2 text-blue-800">3. Segunda Ley (Calidad de la Energía)</h3>
                        <p class="mb-2">Los procesos ocurren en una dirección. Establece que la energía tiene calidad y cantidad.</p>
                        <p class="mb-2"><strong>Enunciado de Kelvin-Planck:</strong> Es imposible construir un dispositivo que opere en un ciclo termodinámico, reciba calor de un solo depósito y produzca una cantidad neta de trabajo.</p>
                        <p class="mb-2"><strong>Enunciado de Clausius:</strong> Es imposible construir un dispositivo que opere en un ciclo sin producir ningún otro efecto que la transferencia de calor de un cuerpo de menor temperatura a uno de mayor temperatura.</p>
                    `,
                    books: [
                        { author: "Çengel", chapters: "Caps 1, 2, 4, 5, 6" },
                        { author: "Moran", chapters: "Caps 1, 2, 4, 5" }
                    ]
                },
                {
                    id: "exergia",
                    title: "Análisis de Exergía",
                    content: `
                        <h3 class="text-lg font-bold mb-2 text-blue-800">1. Definición de Exergía (Disponibilidad)</h3>
                        <p class="mb-2">Es el trabajo útil <strong>máximo</strong> que puede obtenerse de un sistema en un estado y ambiente dados. Representa el potencial de trabajo de la energía contenida en un sistema cuando llega al equilibrio térmico, mecánico y químico con su entorno (estado muerto).</p>
                        <p class="mb-4">A diferencia de la energía (que siempre se conserva según la 1ra ley), la exergía <strong>se destruye</strong> debido a irreversibilidades (fricción, transferencia de calor a través de una diferencia finita de temperatura).</p>

                        <h3 class="text-lg font-bold mb-2 text-blue-800">2. Exergía Específica</h3>
                        <p class="mb-2">Para una masa fija (sistema cerrado), la exergía específica (φ) sin considerar energía cinética y potencial es:</p>
                        <p class="mb-4 font-mono text-sm bg-gray-100 p-2 rounded text-center">φ = (u - u_0) + P_0(v - v_0) - T_0(s - s_0)</p>
                        <p class="mb-2">Para una corriente de flujo (volumen de control), la exergía de flujo (ψ) es:</p>
                        <p class="mb-4 font-mono text-sm bg-gray-100 p-2 rounded text-center">ψ = (h - h_0) - T_0(s - s_0) + V²/2 + gz</p>
                        <p class="text-xs text-gray-500 mb-4">*El subíndice '0' indica las propiedades del entorno (estado muerto).*</p>

                        <h3 class="text-lg font-bold mb-2 text-blue-800">3. Balance de Exergía</h3>
                        <p class="mb-2">El principio de disminución de la exergía establece que la exergía de un sistema aislado durante un proceso siempre decrece o, en el caso límite de un proceso reversible, permanece constante.</p>
                        <p class="mb-2"><strong>Ecuación general:</strong></p>
                        <p class="mb-4 font-mono text-sm bg-gray-100 p-2 rounded text-center">(Exergía_entrada - Exergía_salida) - Exergía_destruida = Cambio_Exergía_sistema</p>
                        <p class="mb-2">La exergía destruida (X_destruida) siempre es proporcional a la entropía generada (S_gen): <br> <span class="font-mono text-sm bg-gray-100 p-1 rounded">X_destruida = T_0 * S_gen ≥ 0</span></p>
                    `,
                    books: [
                        { author: "Çengel", chapters: "Capítulo 8 (Exergy)" },
                        { author: "Moran", chapters: "Capítulo 7 (Exergy Analysis)" }
                    ]
                }
            ]
        },
        2: {
            title: "Segundo Corte: Gases y Psicrometría",
            date: "28 de noviembre",
            topics: [
                {
                    id: "mezclas",
                    title: "Mezcla de Gases (No Reactivas)",
                    content: `
                        <h3 class="text-lg font-bold mb-2 text-blue-800">1. Descripción de la Mezcla</h3>
                        <p class="mb-2">La composición puede describirse mediante <strong>fracciones molares (y_i)</strong> o <strong>fracciones másicas (mf_i)</strong>. La suma de las fracciones de todos los componentes siempre debe ser igual a 1.</p>
                        
                        <h3 class="text-lg font-bold mb-2 text-blue-800">2. Modelos para Gases Ideales</h3>
                        <p class="mb-2"><strong>Modelo de Dalton (Presiones Aditivas):</strong> La presión de una mezcla de gases es igual a la suma de las presiones que cada gas ejercería si existiera solo a la temperatura y volumen de la mezcla.</p>
                        <p class="mb-4 font-mono text-sm bg-gray-100 p-2 rounded text-center">P_mezcla = Σ P_i(T_m, V_m)</p>
                        
                        <p class="mb-2"><strong>Modelo de Amagat (Volúmenes Aditivos):</strong> El volumen de una mezcla de gases es igual a la suma de los volúmenes que cada gas ocuparía si existiera solo a la temperatura y presión de la mezcla.</p>
                        <p class="mb-4 font-mono text-sm bg-gray-100 p-2 rounded text-center">V_mezcla = Σ V_i(T_m, P_m)</p>

                        <h3 class="text-lg font-bold mb-2 text-blue-800">3. Propiedades de Mezclas</h3>
                        <p class="mb-2">Para mezclas de gases ideales, las propiedades extensivas (U, H, S) de la mezcla son simplemente la suma de las propiedades de los componentes evaluadas a la temperatura de la mezcla.</p>
                    `,
                    books: [
                         { author: "Çengel", chapters: "Capítulo 13 (Gas Mixtures)" },
                         { author: "Moran", chapters: "Capítulo 12 (Ideal Gas Mixtures)" }
                    ]
                },
                {
                    id: "psicrometria",
                    title: "Aplicaciones Psicrométricas",
                    content: `
                        <h3 class="text-lg font-bold mb-2 text-blue-800">1. Aire Atmosférico</h3>
                        <p class="mb-4">Es una mezcla de aire seco y vapor de agua. Aunque el vapor de agua está por debajo de su temperatura crítica, a las presiones parciales tan bajas de la atmósfera, se comporta como un <strong>gas ideal</strong>.</p>
                        
                        <h3 class="text-lg font-bold mb-2 text-blue-800">2. Conceptos Clave</h3>
                        <p class="mb-2"><strong>Humedad Específica (Relación de Humedad, ω):</strong> Masa de vapor de agua por unidad de masa de aire seco (kg_vapor / kg_aire_seco).</p>
                        <p class="mb-2 font-mono text-sm bg-gray-100 p-2 rounded text-center">ω = 0.622 * (P_v / (P_atm - P_v))</p>
                        <p class="mb-2"><strong>Humedad Relativa (φ):</strong> Relación entre la masa real de vapor de agua y la masa máxima (saturación) que el aire podría retener a esa temperatura.</p>
                        <p class="mb-4 font-mono text-sm bg-gray-100 p-2 rounded text-center">φ = P_v / P_g(T) </p>
                        <p class="text-xs text-gray-500 mb-4">*P_g es la presión de saturación a la temperatura dada.*</p>

                        <h3 class="text-lg font-bold mb-2 text-blue-800">3. Temperaturas y Carta Psicrométrica</h3>
                        <p class="mb-2"><strong>Temperatura de Bulbo Seco (T_db):</strong> La temperatura ordinaria del aire.</p>
                        <p class="mb-2"><strong>Temperatura de Punto de Rocío (T_dp):</strong> La temperatura a la que inicia la condensación si el aire se enfría a presión constante.</p>
                        <p class="mb-4"><strong>Carta Psicrométrica:</strong> Una herramienta gráfica (diagrama) que relaciona todas estas propiedades. Si conoces dos propiedades intensivas independientes (además de la presión total), puedes encontrar todas las demás propiedades del aire húmedo en la carta, esencial para analizar sistemas de aire acondicionado.</p>
                    `,
                    books: [
                        { author: "Çengel", chapters: "Capítulo 14 (Gas-Vapor Mixtures and Air-Conditioning)" },
                        { author: "Moran", chapters: "Capítulo 12 (Psychrometrics Applications)" },
                        { author: "Wang", chapters: "Handbook of air conditioning (Referencia de Diseño)"}
                    ]
                }
            ]
        },
        3: {
            title: "Tercer Corte: Termoquímica y Ciclos",
            date: "05 de diciembre",
            topics: [
                {
                    id: "combustion",
                    title: "Termoquímica de Mezclas Aire-Combustible",
                    content: `
                        <h3 class="text-lg font-bold mb-2 text-blue-800">1. Balances Químicos</h3>
                        <p class="mb-2"><strong>Aire Teórico (Estequiométrico):</strong> La cantidad exacta de aire necesaria para la combustión <em>completa</em> de un combustible, sin que sobre oxígeno. En la realidad, siempre se suministra <strong>exceso de aire</strong> para garantizar que todo el combustible se queme.</p>
                        <p class="mb-4">Composición del aire idealizado para cálculos: 1 mol de O2 por cada 3.76 moles de N2.</p>

                        <h3 class="text-lg font-bold mb-2 text-blue-800">2. Balance de Energía en Reacciones</h3>
                        <p class="mb-2">Debido a que la composición química cambia, debemos usar una base común para la entalpía.</p>
                        <p class="mb-2"><strong>Entalpía de Formación (h_f°):</strong> La entalpía de una sustancia en su estado estándar (25°C, 1 atm). Para los elementos estables (como O2, N2), se asume que es cero.</p>
                        <p class="mb-2"><strong>Entalpía de Combustión:</strong> El calor liberado durante un proceso de combustión en flujo estacionario cuando 1 kmol de combustible se quema completamente a temperatura y presión especificadas.</p>
                        <p class="mb-4 font-mono text-sm bg-gray-100 p-2 rounded text-center">Q = Σ(N_prod * h_prod) - Σ(N_react * h_react)</p>
                        <p class="text-xs text-gray-500 mb-4">*N es el número de moles, h es la entalpía total (formación + sensible).*</p>
                        
                        <h3 class="text-lg font-bold mb-2 text-blue-800">3. Temperatura de Llama Adiabática</h3>
                        <p class="mb-2">Es la temperatura máxima teórica que alcanzarían los productos si el proceso de combustión fuera completamente adiabático (sin pérdidas de calor) y sin realizar trabajo. Se calcula iterativamente igualando la entalpía de los reactivos a la de los productos.</p>
                    `,
                    books: [
                        { author: "Çengel", chapters: "Capítulo 15 (Chemical Reactions)" },
                        { author: "Moran", chapters: "Capítulo 13 (Reacting Systems)" },
                        { author: "Turns", chapters: "Caps 1, 2 (Combustion and Thermochemistry)" }
                    ]
                },
                {
                    id: "ciclos",
                    title: "Ciclos de Potencia y Refrigeración",
                    content: `
                        <h3 class="text-lg font-bold mb-2 text-blue-800">1. Ciclos de Potencia (Gas y Vapor)</h3>
                        <p class="mb-2"><strong>Ciclo de Carnot:</strong> El ciclo ideal totalmente reversible. Define el límite máximo de eficiencia (1 - T_L/T_H).</p>
                        <p class="mb-2"><strong>Ciclo Otto y Diesel (Gas):</strong> Modelan motores de combustión interna (chispa y compresión respectivamente). Se analizan usando las suposiciones de aire estándar.</p>
                        <p class="mb-2"><strong>Ciclo Brayton (Gas):</strong> El ciclo ideal para turbinas de gas (compresor, cámara de combustión, turbina).</p>
                        <p class="mb-4"><strong>Ciclo Rankine (Vapor):</strong> El ciclo ideal para plantas de potencia de vapor (bomba, caldera, turbina, condensador). Supera los problemas del ciclo de Carnot al operar con bombas para líquidos.</p>

                        <h3 class="text-lg font-bold mb-2 text-blue-800">2. Ciclos de Refrigeración</h3>
                        <p class="mb-2">Su objetivo es transferir calor de un medio de baja temperatura a uno de alta (requiriendo trabajo).</p>
                        <p class="mb-2"><strong>Compresión de Vapor:</strong> El más usado (neveras). Consta de compresor, condensador, válvula de expansión (proceso isoentálpico, no isoentrópico) y evaporador.</p>
                        <p class="mb-4"><strong>Absorción:</strong> Reemplaza el compresor mecánico por un generador impulsado por calor (ej. amoniaco-agua), reduciendo el trabajo de entrada drásticamente pero requiriendo una fuente de calor (a veces residual).</p>

                        <h3 class="text-lg font-bold mb-2 text-blue-800">3. Medidas de Desempeño</h3>
                        <p class="mb-2"><strong>Potencia:</strong> Eficiencia Térmica (η = W_neto / Q_in).</p>
                        <p class="mb-2"><strong>Refrigeradores:</strong> COP_R = Q_L / W_neto_in (puede ser mayor a 1).</p>
                        <p class="mb-4"><strong>Bombas de Calor:</strong> COP_HP = Q_H / W_neto_in = COP_R + 1.</p>
                    `,
                    books: [
                        { author: "Çengel", chapters: "Caps 9, 10, 11 (Gas/Vapor Power Cycles, Refrigeration)" },
                        { author: "Moran", chapters: "Caps 8, 9, 10 (Vapor/Gas Power, Refrigeration)" }
                    ]
                }
            ]
        }
    };

    const currentCorteData = syllabusData[selectedCorte];
    const currentTopicData = currentCorteData.topics.find(t => t.id === selectedTopic) || currentCorteData.topics[0];

    // Helper for authors to avoid hallucinations
    const authorMap = {
        "Çengel": "Yunus A. Çengel - Thermodynamics: An Engineering Approach",
        "Moran": "Michael J. Moran - Fundamentals of Engineering Thermodynamics",
        "Incropera": "Frank P. Incropera - Fundamentals of Heat and Mass Transfer",
        "Turns": "Stephen R. Turns - An Introduction to Combustion",
        "Wang": "Shang Wang - Handbook of air conditioning and refrigeration"
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="bg-blue-900 text-white p-4 shadow-md flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-xl font-bold">TermoNotes UD</h1>
                    <p className="text-xs text-blue-200">Ingeniería Mecánica - Termodinámica Aplicada (19804)</p>
                </div>
                <div className="text-right">
                    <span className="text-sm bg-blue-800 px-3 py-1 rounded-full border border-blue-700">Prof. Carlos Romero</span>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* Sidebar Navigation */}
                <nav className="w-1/3 md:w-1/4 bg-white border-r border-gray-200 flex flex-col overflow-y-auto shrink-0">
                    <div className="p-4 bg-gray-100 border-b font-semibold text-gray-700">
                        Progreso Semestral
                    </div>
                    
                    {[1, 2, 3].map(corteNum => (
                        <div key={corteNum} className="border-b border-gray-100">
                            <button 
                                onClick={() => {
                                    setSelectedCorte(corteNum);
                                    setSelectedTopic(syllabusData[corteNum].topics[0].id);
                                }}
                                className={`w-full text-left p-4 font-medium transition-colors ${selectedCorte === corteNum ? 'bg-blue-50 text-blue-800 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                Corte {corteNum} 
                                <span className="block text-xs font-normal text-gray-400 mt-1">Cierre: {syllabusData[corteNum].date}</span>
                            </button>
                            
                            {/* Topic Sub-menu */}
                            {selectedCorte === corteNum && (
                                <div className="bg-slate-50 py-2">
                                    {syllabusData[corteNum].topics.map(topic => (
                                        <button
                                            key={topic.id}
                                            onClick={() => setSelectedTopic(topic.id)}
                                            className={`w-full text-left pl-8 pr-4 py-2 text-sm transition-colors ${selectedTopic === topic.id || (!selectedTopic && syllabusData[corteNum].topics[0].id === topic.id) ? 'text-blue-700 font-semibold' : 'text-gray-500 hover:text-gray-800'}`}
                                        >
                                            • {topic.title}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Content Panel */}
                <main className="flex-1 p-6 overflow-y-auto bg-white relative">
                    
                    {}
                    <div className="max-w-4xl mx-auto pb-20">
                        <div className="mb-8">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{currentCorteData.title}</h2>
                            <h1 className="text-3xl font-extrabold text-gray-900 border-b pb-4">{currentTopicData.title}</h1>
                        </div>

                        {/* Note Content */}
                        <div 
                            className="prose prose-blue max-w-none text-gray-800 leading-relaxed mb-12"
                            dangerouslySetInnerHTML={{ __html: currentTopicData.content }}
                        />

                        {/* Interactive Calculator Section (CoolProp Mock) */}
                        <div className="bg-white rounded-xl border border-blue-200 p-6 mb-12 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full mix-blend-multiply filter blur-2xl opacity-70 transform translate-x-1/2 -translate-y-1/2"></div>
                             
                             <div className="flex items-center gap-2 mb-4 relative z-10">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                <h3 className="text-lg font-bold text-blue-900">Calculadora de Propiedades (Mock)</h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-4 z-10 relative">Simulador de la API de CoolProp (PropsSI) para la resolución de ejercicios de ciclos y fluidos. <span className="italic text-xs">Nota: Los valores son aproximados por motivos educativos en este entorno.</span></p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Fluido</label>
                                        <select 
                                            value={calcFluid} 
                                            onChange={(e) => setCalcFluid(e.target.value)}
                                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="Water">Agua / Vapor (Water)</option>
                                            <option value="Air">Aire (Air)</option>
                                            <option value="R134a">Refrigerante 134a (R134a)</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-1/3">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Prop. 1</label>
                                            <select value={calcProp1Type} onChange={(e) => setCalcProp1Type(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                                <option value="T">Temp (K)</option>
                                                <option value="P">Presión (Pa)</option>
                                                <option value="Q">Calidad</option>
                                            </select>
                                        </div>
                                        <div className="w-2/3">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Valor</label>
                                            <input type="number" value={calcProp1Value} onChange={(e) => setCalcProp1Value(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-1/3">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Prop. 2</label>
                                            <select value={calcProp2Type} onChange={(e) => setCalcProp2Type(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                                <option value="P">Presión (Pa)</option>
                                                <option value="T">Temp (K)</option>
                                                <option value="Q">Calidad</option>
                                            </select>
                                        </div>
                                        <div className="w-2/3">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Valor</label>
                                            <input type="number" value={calcProp2Value} onChange={(e) => setCalcProp2Value(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 flex flex-col">
                                     <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Propiedad a Calcular</label>
                                        <select 
                                            value={calcOutputProp} 
                                            onChange={(e) => setCalcOutputProp(e.target.value)}
                                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="H">Entalpía (H)</option>
                                            <option value="S">Entropía (S)</option>
                                            <option value="D">Densidad (D)</option>
                                        </select>
                                    </div>

                                    <button 
                                        onClick={handleCalculateProperty}
                                        disabled={calcLoading}
                                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors"
                                    >
                                        {calcLoading ? 'Calculando...' : 'Obtener Propiedad (PropsSI)'}
                                    </button>

                                    <div className="mt-auto pt-4">
                                        {calcError && <div className="text-red-500 text-sm font-medium">{calcError}</div>}
                                        {calcResult && (
                                            <div className="bg-gray-50 border border-gray-200 rounded p-4 text-center">
                                                <span className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Resultado</span>
                                                <span className="text-2xl font-mono text-gray-900 font-bold">{calcResult}</span>
                                            </div>
                                        )}
                                        {!calcResult && !calcError && (
                                             <div className="bg-gray-50 border border-gray-200 rounded p-4 text-center text-gray-400 text-sm italic">
                                                El resultado aparecerá aquí
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Assistant Section */}
                        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6 mb-12 shadow-sm relative overflow-hidden">
                            {/* Decorative background accent */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
                            
                            <div className="flex items-center gap-2 mb-6 relative z-10">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                <h3 className="text-xl font-bold text-indigo-900">Tutor con IA (Gemini)</h3>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 mb-4 relative z-10">
                                <div className="flex-1 flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Pregunta algo sobre este tema..." 
                                        className="flex-1 border border-indigo-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                        value={userQuestion}
                                        onChange={(e) => setUserQuestion(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAskAI('chat')}
                                        disabled={aiLoading}
                                    />
                                    <button 
                                        onClick={() => handleAskAI('chat')}
                                        disabled={aiLoading || !userQuestion.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                                    >
                                        <span>Preguntar</span>
                                    </button>
                                </div>
                                <div className="text-center sm:text-left">
                                    <span className="text-indigo-300 font-medium hidden sm:inline px-2">o</span>
                                </div>
                                <button 
                                    onClick={() => handleAskAI('quiz')}
                                    disabled={aiLoading}
                                    className="bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-sm whitespace-nowrap"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                    Generar Quiz
                                </button>
                            </div>

                            {/* AI Response Area */}
                            {(aiLoading || aiResponse) && (
                                <div className="mt-6 bg-white p-5 rounded-xl border border-indigo-100 shadow-inner">
                                    {aiLoading ? (
                                        <div className="flex items-center gap-3 text-indigo-600 animate-pulse">
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="font-medium">
                                                {activeAiTab === 'quiz' ? 'Generando quiz interactivo...' : 'El profesor AI está escribiendo...'}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                                            {aiResponse}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bibliography Section - Grounded strictly to syllabus */}
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mt-8">
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                <h3 className="text-lg font-bold text-gray-800">Bibliografía Recomendada para este tema</h3>
                            </div>
                            <ul className="space-y-3">
                                {currentTopicData.books.map((book, idx) => (
                                    <li key={idx} className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-4 text-sm border-l-2 border-blue-400 pl-3">
                                        <span className="font-semibold text-gray-900 min-w-[120px]">{book.author}</span>
                                        <span className="text-gray-600 italic flex-1">{authorMap[book.author]}</span>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">
                                            {book.chapters}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-gray-500 mt-4 italic">* Las referencias están alineadas estrictamente al syllabus oficial 19804 para evitar material externo irrelevante.</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TermoApp;