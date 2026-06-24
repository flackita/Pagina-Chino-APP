// =================================================================
// MODO TONOS  (nombre provisional, se puede renombrar fácilmente:
// basta con cambiar el texto del botón en el navbar y los títulos
// de esta pantalla; las funciones/ids quedarían igual)
//
// Por cada hanzi de UN SOLO CARÁCTER (h.length === 1):
//   Parte 1 -> se ve el hanzi, hay que escribir el pinyin SIN tono.
//   Parte 2 -> "¿Qué tono lleva?" con 5 opciones (tonos 1-4 + "sin tono").
//   Parte 3 -> "¿Qué significa?" con 4 opciones (1 correcta + 3 al azar).
//
// Reutiliza baseDeDatosHSK, que ya carga app.js en window.onload.
// =================================================================

let mazoCompletoTonosFiltrado = [];
let mazoTonosActual = [];
let indiceTonoActual = 0;
let parteTonoActual = 1; // 1, 2 o 3
let tonosMalosRecolectados = [];
let itemTonoFuePenalizado = false;
let esperandoSiguienteTono = false;

let _tonoCorrectoActual = null;        // 1-5
let _significadoCorrectoActual = null; // string

const TAMANO_SUBMAZO_TONOS = 40;
const NOMBRES_TONO = ['1er tono (ā)', '2do tono (á)', '3er tono (ǎ)', '4to tono (à)', 'Sin tono'];

// --- utilidades de pinyin ---

// Quita las marcas diacríticas (tono) para comparar lo que el usuario escribe.
function quitarTonoPinyin(pinyin) {
    return pinyin
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .normalize('NFC')
        .trim()
        .toLowerCase();
}

// Detecta el número de tono a partir de las marcas diacríticas Unicode.
// Si no encuentra ninguna marca de tono, es un tono neutro ("sin tono").
function obtenerTonoPinyin(pinyin) {
    const descompuesto = pinyin.normalize('NFD');
    if (descompuesto.includes('\u0304')) return 1; // macron   ā ē ī ō ū
    if (descompuesto.includes('\u0301')) return 2; // acute    á é í ó ú
    if (descompuesto.includes('\u030C')) return 3; // caron    ǎ ě ǐ ǒ ǔ
    if (descompuesto.includes('\u0300')) return 4; // grave    à è ì ò ù
    return 5; // sin marca de tono -> neutro
}

function mezclarTonos(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Punto de entrada: lo llama cambiarModo('tonos') en app.js
function iniciarModoTonos() {
    if (!baseDeDatosHSK || baseDeDatosHSK.length === 0) {
        alert("Todavía no se cargó el diccionario. Revisa data/hsk.json.");
        salirDeTonos();
        return;
    }
    mostrarPasoMazoTonos();
}

// Construye los botones de mazo solo con las categorías que tengan
// al menos un hanzi de un solo carácter.
function mostrarPasoMazoTonos() {
    document.getElementById('tonos-game-container').style.display = 'none';
    document.getElementById('tonos-step-mazo').style.display = 'block';

    const grid = document.getElementById('tonos-deck-grid');
    grid.innerHTML = '';

    const categorias = [...new Set(baseDeDatosHSK.map(p => p.cat))];
    let hayAlMenosUna = false;

    categorias.forEach(cat => {
        const cantidad = baseDeDatosHSK.filter(p => p.cat === cat && p.h.trim().length === 1).length;
        if (cantidad === 0) return;
        hayAlMenosUna = true;

        const boton = document.createElement('button');
        boton.className = 'deck-card';
        boton.onclick = () => seleccionarMazoTonos(cat);
        boton.innerHTML = `
            <span class="deck-title">${cat.toUpperCase()}</span>
            <span class="deck-desc">${cantidad} hanzis</span>
        `;
        grid.appendChild(boton);
    });

    if (!hayAlMenosUna) {
        grid.innerHTML = '<p class="menu-subtitle">No hay hanzis de un solo carácter en el diccionario todavía.</p>';
    }
}

function seleccionarMazoTonos(cat) {
    mazoCompletoTonosFiltrado = baseDeDatosHSK.filter(p => p.cat === cat && p.h.trim().length === 1);

    if (mazoCompletoTonosFiltrado.length === 0) {
        alert(`No se encontraron hanzis de un carácter para: ${cat.toUpperCase()}`);
        return;
    }

    if (mazoCompletoTonosFiltrado.length <= TAMANO_SUBMAZO_TONOS) {
        iniciarSesionTonos([...mazoCompletoTonosFiltrado]);
        return;
    }

    const selector = document.getElementById('select-tonos-bloque');
    selector.innerHTML = '';

    const total = mazoCompletoTonosFiltrado.length;
    let bloqueNumero = 1;
    for (let i = 0; i < total; i += TAMANO_SUBMAZO_TONOS) {
        const fin = Math.min(i + TAMANO_SUBMAZO_TONOS, total);
        const opcion = document.createElement('option');
        opcion.value = `${i}-${fin}`;
        opcion.innerText = `Bloque ${bloqueNumero} (Hanzis ${i + 1} a ${fin})`;
        selector.appendChild(opcion);
        bloqueNumero++;
    }

    document.getElementById('tonos-modal-deck-name').innerText = cat.toUpperCase();
    document.getElementById('tonos-quantity-modal').style.display = 'flex';
}

function confirmarBloqueTonos() {
    const rango = document.getElementById('select-tonos-bloque').value.split('-');
    const inicio = parseInt(rango[0]);
    const fin = parseInt(rango[1]);
    const bloque = mazoCompletoTonosFiltrado.slice(inicio, fin);

    document.getElementById('tonos-quantity-modal').style.display = 'none';
    iniciarSesionTonos(bloque);
}

function cerrarModalTonos() {
    document.getElementById('tonos-quantity-modal').style.display = 'none';
    mazoCompletoTonosFiltrado = [];
}

function iniciarSesionTonos(bloque) {
    mazoTonosActual = mezclarTonos(bloque);
    indiceTonoActual = 0;
    tonosMalosRecolectados = [];

    document.getElementById('tonos-correct').innerText = '0';
    document.getElementById('tonos-wrong').innerText = '0';

    document.getElementById('tonos-step-mazo').style.display = 'none';
    document.getElementById('tonos-game-container').style.display = 'flex';

    mostrarItemTonos();
}

function mostrarItemTonos() {
    if (!mazoTonosActual || indiceTonoActual >= mazoTonosActual.length) {
        finalizarSesionTonos();
        return;
    }
    itemTonoFuePenalizado = false;
    mostrarParteTonos(1);
}

function actualizarCabeceraTonos(nombreParte) {
    const total = mazoTonosActual.length;
    document.getElementById('tonos-etapa-label').innerText = `Hanzi ${indiceTonoActual + 1} de ${total}`;
    document.getElementById('tonos-parte-nombre').innerText = nombreParte;
    const pct = (indiceTonoActual / total * 100).toFixed(0);
    document.getElementById('tonos-barra').style.width = pct + '%';
}

function mostrarParteTonos(parte) {
    parteTonoActual = parte;
    esperandoSiguienteTono = false;

    document.getElementById('tonos-parte-1').style.display = parte === 1 ? 'block' : 'none';
    document.getElementById('tonos-parte-2').style.display = parte === 2 ? 'block' : 'none';
    document.getElementById('tonos-parte-3').style.display = parte === 3 ? 'block' : 'none';

    const item = mazoTonosActual[indiceTonoActual];

    if (parte === 1) {
        actualizarCabeceraTonos('Parte 1 · Escribe el pinyin (sin tono)');
        document.getElementById('tonos-hanzi-1').innerText = item.h;
        document.getElementById('tonos-hint-1').style.display = 'none';
        document.getElementById('tonos-significado-hint-1').innerText = item.s;
        const input = document.getElementById('tonos-input-pinyin');
        input.value = '';
        input.disabled = false;
        input.focus();
    } else if (parte === 2) {
        actualizarCabeceraTonos('Parte 2 · ¿Qué tono lleva?');
        document.getElementById('tonos-hanzi-2').innerText = item.h;
        construirOpcionesTono(item);
    } else if (parte === 3) {
        actualizarCabeceraTonos('Parte 3 · ¿Qué significa?');
        document.getElementById('tonos-hanzi-3').innerText = item.h;
        document.getElementById('tonos-pinyin-3').innerText = item.p;
        construirOpcionesSignificado(item);
    }
}

// --- PARTE 1: escribir el pinyin sin tono ---
function monitorearPinyinTonos() {
    if (esperandoSiguienteTono) return;

    const input = document.getElementById('tonos-input-pinyin');
    const item = mazoTonosActual[indiceTonoActual];
    const correcto = quitarTonoPinyin(item.p);
    const escrito = quitarTonoPinyin(input.value);

    if (escrito.length > 0 && escrito === correcto) {
        esperandoSiguienteTono = true;
        input.disabled = true;
        setTimeout(() => mostrarParteTonos(2), 500);
    }
}

// --- PARTE 2: opción múltiple del tono ---
function construirOpcionesTono(item) {
    const contenedor = document.getElementById('tonos-opciones-tono');
    contenedor.innerHTML = '';
    _tonoCorrectoActual = obtenerTonoPinyin(item.p);

    NOMBRES_TONO.forEach((nombre, idx) => {
        const numeroTono = idx + 1;
        const boton = document.createElement('button');
        boton.className = 'modal-opt-btn tonos-opcion-btn';
        boton.innerText = nombre;
        boton.onclick = () => responderTono(boton, numeroTono);
        contenedor.appendChild(boton);
    });
}

function responderTono(boton, elegido) {
    if (esperandoSiguienteTono) return;

    if (elegido === _tonoCorrectoActual) {
        esperandoSiguienteTono = true;
        boton.classList.add('tonos-correcta');
        deshabilitarOpcionesTonos('tonos-opciones-tono');
        setTimeout(() => mostrarParteTonos(3), 700);
    } else {
        boton.classList.add('tonos-incorrecta');
        penalizarItemTonos();
        setTimeout(() => boton.classList.remove('tonos-incorrecta'), 400);
    }
}

// --- PARTE 3: opción múltiple del significado ---
function construirOpcionesSignificado(item) {
    const contenedor = document.getElementById('tonos-opciones-significado');
    contenedor.innerHTML = '';
    _significadoCorrectoActual = item.s;

    const distractoresUnicos = [...new Set(
        baseDeDatosHSK.filter(p => p.s && p.s !== item.s).map(p => p.s)
    )];
    mezclarTonos(distractoresUnicos);

    const opciones = mezclarTonos([item.s, ...distractoresUnicos.slice(0, 3)]);

    opciones.forEach(texto => {
        const boton = document.createElement('button');
        boton.className = 'modal-opt-btn tonos-opcion-btn';
        boton.innerText = texto;
        boton.onclick = () => responderSignificado(boton, texto);
        contenedor.appendChild(boton);
    });
}

function responderSignificado(boton, elegido) {
    if (esperandoSiguienteTono) return;

    if (elegido === _significadoCorrectoActual) {
        esperandoSiguienteTono = true;
        boton.classList.add('tonos-correcta');
        deshabilitarOpcionesTonos('tonos-opciones-significado');
        setTimeout(() => avanzarSiguienteItemTonos(), 700);
    } else {
        boton.classList.add('tonos-incorrecta');
        penalizarItemTonos();
        setTimeout(() => boton.classList.remove('tonos-incorrecta'), 400);
    }
}

function deshabilitarOpcionesTonos(idContenedor) {
    document.querySelectorAll(`#${idContenedor} .tonos-opcion-btn`).forEach(b => {
        b.disabled = true;
    });
}

// --- pista / saltar (comunes a las 3 partes) ---
function pistaTonos() {
    if (esperandoSiguienteTono) return;
    penalizarItemTonos();

    if (parteTonoActual === 1) {
        document.getElementById('tonos-hint-1').style.display = 'block';
    } else if (parteTonoActual === 2) {
        eliminarUnaOpcionIncorrecta('tonos-opciones-tono', NOMBRES_TONO[_tonoCorrectoActual - 1]);
    } else if (parteTonoActual === 3) {
        eliminarUnaOpcionIncorrecta('tonos-opciones-significado', _significadoCorrectoActual);
    }
}

// Deshabilita visualmente UNA opción incorrecta (que el usuario aún no
// haya tocado) para darle una ayuda sin revelar la respuesta completa.
function eliminarUnaOpcionIncorrecta(idContenedor, textoCorrecto) {
    const candidatos = [...document.querySelectorAll(`#${idContenedor} .tonos-opcion-btn`)]
        .filter(b => !b.disabled && b.innerText !== textoCorrecto);

    if (candidatos.length === 0) return;
    const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];
    elegido.disabled = true;
    elegido.classList.add('tonos-deshabilitada');
}

function saltarTonos() {
    if (esperandoSiguienteTono) return;
    penalizarItemTonos();
    esperandoSiguienteTono = true;
    avanzarSiguienteItemTonos(true);
}

function penalizarItemTonos() {
    if (itemTonoFuePenalizado) return;
    itemTonoFuePenalizado = true;

    const scoreWrong = document.getElementById('tonos-wrong');
    scoreWrong.innerText = parseInt(scoreWrong.innerText) + 1;

    const item = mazoTonosActual[indiceTonoActual];
    if (!tonosMalosRecolectados.some(p => p.h === item.h)) {
        tonosMalosRecolectados.push(item);
    }
}

function avanzarSiguienteItemTonos(fueSalto) {
    if (!fueSalto && !itemTonoFuePenalizado) {
        const scoreCorrect = document.getElementById('tonos-correct');
        scoreCorrect.innerText = parseInt(scoreCorrect.innerText) + 1;
    }
    indiceTonoActual++;
    mostrarItemTonos();
}

function finalizarSesionTonos() {
    const correctas = document.getElementById('tonos-correct').innerText;
    const incorrectas = tonosMalosRecolectados.length;

    alert(`Bloque completado.\nCorrectas: ${correctas}\nPor repasar: ${incorrectas}`);
    mostrarPasoMazoTonos();
}

function salirDeTonos() {
    document.getElementById('tonos-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'block';

    mazoTonosActual = [];
    indiceTonoActual = 0;
}
