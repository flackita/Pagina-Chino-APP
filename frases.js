// =================================================================
// MODO FRASES
// Misma lógica que el modo Flashcards (app.js): primero se elige un
// mazo (nivel/cat) y, si tiene más de TAMANO_SUBMAZO_FRASES frases,
// se elige un bloque de hasta 50 antes de empezar a practicar.
// =================================================================

let baseDeDatosFrases = [];
let mazoCompletoFrasesFiltrado = [];
let mazoFrasesActual = [];
let indiceFraseActual = 0;
let frasesMalasRecolectadas = [];
let fraseActualFuePenalizada = false;
let esperandoSiguienteFrase = false;
let pistaFraseVisible = false;
let nivelFrasesSeleccionado = "";

const TAMANO_SUBMAZO_FRASES = 50;

// Carga data/frases.json una sola vez (igual que hsk.json en app.js)
async function inicializarFrases() {
    if (baseDeDatosFrases.length > 0) return;

    try {
        const respuesta = await fetch('data/frases.json');
        if (!respuesta.ok) {
            throw new Error(`No se pudo cargar frases.json (Estado: ${respuesta.status})`);
        }
        baseDeDatosFrases = await respuesta.json();
    } catch (error) {
        console.error("Error al cargar la base de datos de frases:", error);
        alert("Hubo un problema al cargar el archivo data/frases.json. Recuerda usar Live Server.");
    }
}

function mezclarFrases(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Punto de entrada: lo llama cambiarModo('frases') en app.js
async function iniciarModoFrases() {
    await inicializarFrases();

    if (!baseDeDatosFrases || baseDeDatosFrases.length === 0) {
        alert("Todavía no hay frases cargadas. Revisa data/frases.json.");
        salirDeFrases();
        return;
    }

    mostrarPasoMazoFrases();
}

// Construye dinámicamente los botones de mazo según las categorías
// (`cat`) que existan en data/frases.json. Así, cuando agregues más
// niveles, los botones aparecen solos sin tocar el HTML.
function mostrarPasoMazoFrases() {
    document.getElementById('frases-game-container').style.display = 'none';
    document.getElementById('frases-step-mazo').style.display = 'block';

    const grid = document.getElementById('frases-deck-grid');
    grid.innerHTML = "";

    const categorias = [...new Set(baseDeDatosFrases.map(f => f.cat))];

    categorias.forEach(cat => {
        const cantidad = baseDeDatosFrases.filter(f => f.cat === cat).length;

        const boton = document.createElement('button');
        boton.className = 'deck-card';
        boton.onclick = () => seleccionarMazoFrases(cat);
        boton.innerHTML = `
            <span class="deck-title">${cat.toUpperCase()}</span>
            <span class="deck-desc">${cantidad} frases</span>
        `;
        grid.appendChild(boton);
    });
}

function seleccionarMazoFrases(cat) {
    nivelFrasesSeleccionado = cat;
    mazoCompletoFrasesFiltrado = baseDeDatosFrases.filter(f => f.cat === cat);

    if (mazoCompletoFrasesFiltrado.length === 0) {
        alert(`No se encontraron frases para: ${cat.toUpperCase()}`);
        return;
    }

    // Si el mazo ya es chico, se empieza directo sin pedir bloque.
    if (mazoCompletoFrasesFiltrado.length <= TAMANO_SUBMAZO_FRASES) {
        iniciarSesionFrases([...mazoCompletoFrasesFiltrado]);
        return;
    }

    const selector = document.getElementById('select-frases-bloque');
    selector.innerHTML = "";

    const total = mazoCompletoFrasesFiltrado.length;
    let bloqueNumero = 1;
    for (let i = 0; i < total; i += TAMANO_SUBMAZO_FRASES) {
        const fin = Math.min(i + TAMANO_SUBMAZO_FRASES, total);
        const opcion = document.createElement('option');
        opcion.value = `${i}-${fin}`;
        opcion.innerText = `Bloque ${bloqueNumero} (Frases ${i + 1} a ${fin})`;
        selector.appendChild(opcion);
        bloqueNumero++;
    }

    document.getElementById('frases-modal-deck-name').innerText = cat.toUpperCase();
    document.getElementById('frases-quantity-modal').style.display = 'flex';
}

function confirmarBloqueFrases() {
    const rango = document.getElementById('select-frases-bloque').value.split('-');
    const inicio = parseInt(rango[0]);
    const fin = parseInt(rango[1]);

    const bloque = mazoCompletoFrasesFiltrado.slice(inicio, fin);

    document.getElementById('frases-quantity-modal').style.display = 'none';
    iniciarSesionFrases(bloque);
}

function cerrarModalFrases() {
    document.getElementById('frases-quantity-modal').style.display = 'none';
    nivelFrasesSeleccionado = "";
    mazoCompletoFrasesFiltrado = [];
}

function iniciarSesionFrases(bloque) {
    mazoFrasesActual = mezclarFrases(bloque);
    indiceFraseActual = 0;
    frasesMalasRecolectadas = [];

    document.getElementById('frases-correct').innerText = "0";
    document.getElementById('frases-wrong').innerText = "0";

    document.getElementById('frases-step-mazo').style.display = 'none';
    document.getElementById('frases-game-container').style.display = 'flex';

    mostrarFrase();
}

function mostrarFrase() {
    if (!mazoFrasesActual || indiceFraseActual >= mazoFrasesActual.length) {
        finalizarSesionFrases();
        return;
    }

    fraseActualFuePenalizada = false;
    esperandoSiguienteFrase = false;
    pistaFraseVisible = false;

    const frase = mazoFrasesActual[indiceFraseActual];

    document.getElementById('display-frase').innerText = frase.h;
    document.getElementById('frase-numero').innerText = `Frase #${frase.n}`;
    document.getElementById('display-frase-pinyin').innerText = frase.p;
    document.getElementById('display-frase-significado').innerText = frase.s;
    document.getElementById('sentence-hint').style.display = 'none';

    const input = document.getElementById('frase-input');
    input.value = "";
    input.disabled = false;
    input.focus();
}

function monitorearEscrituraFrase() {
    if (esperandoSiguienteFrase || mazoFrasesActual.length === 0) return;

    const input = document.getElementById('frase-input');
    const fraseActual = mazoFrasesActual[indiceFraseActual];

    const respuestaFiltrada = input.value.trim();
    const fraseCorrecta = fraseActual.h.trim();

    if (respuestaFiltrada === fraseCorrecta) {
        esperandoSiguienteFrase = true;
        input.disabled = true;

        if (!fraseActualFuePenalizada) {
            const scoreCorrect = document.getElementById('frases-correct');
            scoreCorrect.innerText = parseInt(scoreCorrect.innerText) + 1;
        }

        setTimeout(() => {
            avanzarSiguienteFrase();
        }, 800);
    }
}

function avanzarSiguienteFrase() {
    indiceFraseActual++;
    mostrarFrase();
}

// Mostrar/ocultar pinyin + significado. La primera vez que se pide
// pista en una frase, esa frase cuenta como incorrecta (igual que
// voltear la flashcard antes de escribir bien en el modo normal).
function mostrarPistaFrase() {
    if (esperandoSiguienteFrase || mazoFrasesActual.length === 0) return;

    pistaFraseVisible = !pistaFraseVisible;
    document.getElementById('sentence-hint').style.display = pistaFraseVisible ? 'block' : 'none';

    if (pistaFraseVisible && !fraseActualFuePenalizada) {
        penalizarFraseActual();
    }
}
 
function saltarFrase() {
    if (esperandoSiguienteFrase || mazoFrasesActual.length === 0) return;

    if (!fraseActualFuePenalizada) {
        penalizarFraseActual();
    }

    avanzarSiguienteFrase();
}

function penalizarFraseActual() {
    fraseActualFuePenalizada = true;

    const scoreWrong = document.getElementById('frases-wrong');
    scoreWrong.innerText = parseInt(scoreWrong.innerText) + 1;

    const fraseActual = mazoFrasesActual[indiceFraseActual];
    if (!frasesMalasRecolectadas.some(f => f.h === fraseActual.h)) {
        frasesMalasRecolectadas.push(fraseActual);
    }
}

// Al terminar un bloque, vuelve al selector de mazos (no al menú
// principal) para que sea fácil encadenar el siguiente bloque.
function finalizarSesionFrases() {
    const correctas = document.getElementById('frases-correct').innerText;
    const incorrectas = frasesMalasRecolectadas.length;

    alert(`Bloque completado.\nCorrectas: ${correctas}\nPor repasar: ${incorrectas}`);
    mostrarPasoMazoFrases();
}

function salirDeFrases() {
    document.getElementById('frases-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'block';

    mazoFrasesActual = [];
    indiceFraseActual = 0;
}
