let baseDeDatosHSK = []; 
    let mazoCompletoFiltrado = [];
    let mazoActual = [];
    let indiceActual = 0;
    let palabrasMalasRecolectadas = []; 
    let tarjetaActualFuePenalizada = false;
    let esperandoSiguiente = false;
    let temporizadorPista = null;
    let nivelSeleccionadoTemporal = "";
    let esModoDesafioGlobal = false;
    let cartasVolteadas = [];
    let bloqueandoTablero = false;
    let configuracionMemorice = {
    mazo: null,
    modo: null,
    cantidad: null
    };
    let tiempoInicio = null;
    let intervaloTimer = null;
    const TAMANO_SUBMAZO = 200;

    async function inicializarAplicacion() {
        try {
            const respuesta = await fetch('data/hsk.json');
            if (!respuesta.ok) {
                throw new Error(`No se pudo cargar el archivo hsk.json (Estado: ${respuesta.status})`);
            }
            baseDeDatosHSK = await respuesta.json();
        } catch (error) {
            console.error("Error al cargar la base de datos:", error);
            alert("Hubo un problema al cargar el archivo hsk.json. Recuerda usar Live Server.");
        }
    }

    window.onload = async () => {
        await inicializarAplicacion(); 
    };

    function seleccionarMazo(nombreMazo) {
        if (!baseDeDatosHSK || baseDeDatosHSK.length === 0) return;

        esModoDesafioGlobal = false;
        nivelSeleccionadoTemporal = nombreMazo;
        document.getElementById('modal-deck-name').innerText = nombreMazo.toUpperCase();

        mazoCompletoFiltrado = baseDeDatosHSK.filter(palabra => palabra.cat === nombreMazo);

        if (mazoCompletoFiltrado.length === 0) {
            alert(`No se encontraron palabras para: ${nombreMazo.toUpperCase()}`);
            return;
        }

        const selector = document.getElementById('select-subdeck');
        selector.innerHTML = ""; 

        const totalPalabras = mazoCompletoFiltrado.length;
        const btnBackModal = document.getElementById('btn-modal-back');
        
        if (totalPalabras > TAMANO_SUBMAZO) {
            let bloqueNumero = 1;
            for (let i = 0; i < totalPalabras; i += TAMANO_SUBMAZO) {
                const fin = Math.min(i + TAMANO_SUBMAZO, totalPalabras);
                const opcion = document.createElement('option');
                opcion.value = `${i}-${fin}`;
                opcion.innerText = `Bloque ${bloqueNumero} (Palabras ${i + 1} a ${fin})`;
                selector.appendChild(opcion);
                bloqueNumero++;
            }
            document.getElementById('modal-step-subdeck').style.display = 'block';
            document.getElementById('modal-step-quantity').style.display = 'none';
            if (btnBackModal) btnBackModal.style.display = 'inline-block';
        } else {
            const opcionUnica = document.createElement('option');
            opcionUnica.value = `0-${totalPalabras}`;
            opcionUnica.innerText = `Todo el mazo (${totalPalabras} palabras)`;
            selector.appendChild(opcionUnica);
            
            document.getElementById('modal-step-subdeck').style.display = 'none';
            document.getElementById('modal-step-quantity').style.display = 'block';
            if (btnBackModal) btnBackModal.style.display = 'none'; 
        }

        document.getElementById('quantity-modal').style.display = 'flex';
    }

    function seleccionarMazoDesafio(modo) {
        if (!baseDeDatosHSK || baseDeDatosHSK.length === 0) return;

        esModoDesafioGlobal = true;
        let categoriesAIncluir = [];

        if (modo === 'avanzado') {
            nivelSeleccionadoTemporal = "Modo Avanzado (HSK 1-3)";
            categoriesAIncluir = ['hsk1', 'hsk2', 'hsk3'];
        } else if (modo === 'pro') {
            nivelSeleccionadoTemporal = "Modo Pro (HSK 1-5)";
            categoriesAIncluir = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5'];
        } else if (modo === 'ultra') {
            nivelSeleccionadoTemporal = "Modo Ultra (Todos)";
            categoriesAIncluir = [...new Set(baseDeDatosHSK.map(p => p.cat))]; 
        }

        mazoCompletoFiltrado = baseDeDatosHSK.filter(palabra => categoriesAIncluir.includes(palabra.cat));
        document.getElementById('modal-deck-name').innerText = nivelSeleccionadoTemporal;

        document.getElementById('modal-step-subdeck').style.display = 'none';
        document.getElementById('modal-step-quantity').style.display = 'block';

        const btnBackModal = document.getElementById('btn-modal-back');
        if (btnBackModal) btnBackModal.style.display = 'none';

        document.getElementById('quantity-modal').style.display = 'flex';
    }

    function irAPasoCantidad() {
        document.getElementById('modal-step-subdeck').style.display = 'none';
        document.getElementById('modal-step-quantity').style.display = 'block';
    }

    function regresarAPasoSubdeck() {
        if (mazoCompletoFiltrado.length > TAMANO_SUBMAZO && !esModoDesafioGlobal) {
            document.getElementById('modal-step-quantity').style.display = 'none';
            document.getElementById('modal-step-subdeck').style.display = 'block';
        }
    }


    function cerrarModal() {
        document.getElementById('quantity-modal').style.display = 'none';
        nivelSeleccionadoTemporal = "";
        mazoCompletoFiltrado = [];
        esModoDesafioGlobal = false;
    }

    function confirmarCantidad(cantidad) {
        let bloqueEstudio = [];
        palabrasMalasRecolectadas = []; 

        if (esModoDesafioGlobal) {
            bloqueEstudio = [...mazoCompletoFiltrado];
        } else {
            const rangoCorte = document.getElementById('select-subdeck').value.split('-');
            const inicio = parseInt(rangoCorte[0]);
            const fin = parseInt(rangoCorte[1]);
            bloqueEstudio = mazoCompletoFiltrado.slice(inicio, fin);
        }

        for (let i = bloqueEstudio.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [bloqueEstudio[i], bloqueEstudio[j]] = [bloqueEstudio[j], bloqueEstudio[i]];
        }

        if (cantidad !== 'todo') {
            bloqueEstudio = bloqueEstudio.slice(0, parseInt(cantidad));
        }

        mazoActual = bloqueEstudio;
        indiceActual = 0;

        document.getElementById('score-correct').innerText = "0";
        document.getElementById('score-wrong').innerText = "0";

        let textoTituloPrincipal = "";
        let textoTituloNavbar = "";

        if (esModoDesafioGlobal) {
            textoTituloPrincipal = `${nivelSeleccionadoTemporal}`;
            textoTituloNavbar = nivelSeleccionadoTemporal.split(' (')[0];
        } else {
            const selector = document.getElementById('select-subdeck');
            const textoBloque = selector.options[selector.selectedIndex].text.split(' (')[0];
            textoTituloPrincipal = `${nivelSeleccionadoTemporal.toUpperCase()} - ${textoBloque}`;
            textoTituloNavbar = `${nivelSeleccionadoTemporal.toUpperCase()} - ${textoBloque.replace('Bloque ', 'B')}`;
        }

        document.getElementById('quantity-modal').style.display = 'none';
        document.getElementById('menu-screen').style.display = 'none';
        document.getElementById('study-screen').style.display = 'block'
        document.getElementById('btn-skip').style.display = 'inline-block';

        mostrarTarjeta();
    }

    function actualizarContadorPalabrasRestantes() {
        let textoContador = "";
        let restante = mazoActual.length - indiceActual;
        if (restante < 0) restante = 0;
        
        if (esModoDesafioGlobal) {
            textoContador = `${nivelSeleccionadoTemporal} (${restante} restantes)`;
        } else {
            const selector = document.getElementById('select-subdeck');
            if (selector && selector.selectedIndex >= 0 && mazoCompletoFiltrado.length > TAMANO_SUBMAZO) {
                const textoBloqueSeleccionado = selector.options[selector.selectedIndex].text.split(' (')[0];
                textoContador = `${nivelSeleccionadoTemporal.toUpperCase()} - ${textoBloqueSeleccionado} (${restante} restantes)`;
            } else {
                textoContador = `${nivelSeleccionadoTemporal.toUpperCase()} (${restante} restantes)`;
            }
        }
    }

    function mostrarTarjeta() {
        if (!mazoActual || mazoActual.length === 0 || indiceActual >= mazoActual.length) return;

        const tarjeta = document.getElementById('flashcard');
        tarjeta.classList.remove('flipped'); 

        if (temporizadorPista) clearTimeout(temporizadorPista); 

        tarjetaActualFuePenalizada = false;
        esperandoSiguiente = false;

        const palabraActual = mazoActual[indiceActual];

        document.getElementById('display-hanzi').innerText = palabraActual.h;
        document.getElementById('display-pinyin').innerText = palabraActual.p;
        document.getElementById('display-significado').innerText = palabraActual.s;

        actualizarContadorPalabrasRestantes();

        const inputUsuario = document.getElementById('user-input');
        inputUsuario.value = "";
        inputUsuario.disabled = false;
        inputUsuario.focus();
    }

    function interactuarTarjeta() {
        if (esperandoSiguiente || mazoActual.length === 0) return;

        const tarjeta = document.getElementById('flashcard');
        
        if (!tarjeta.classList.contains('flipped')) {
            tarjeta.classList.add('flipped');
            
            if (!tarjetaActualFuePenalizada) {
                tarjetaActualFuePenalizada = true;
                const scoreWrong = document.getElementById('score-wrong');
                if (scoreWrong) scoreWrong.innerText = parseInt(scoreWrong.innerText) + 1;
                
                if (!palabrasMalasRecolectadas.some(p => p.h === mazoActual[indiceActual].h)) {
                    palabrasMalasRecolectadas.push(mazoActual[indiceActual]);
                }
            }

            if (temporizadorPista) clearTimeout(temporizadorPista);

            temporizadorPista = setTimeout(() => {
                if (!esperandoSiguiente) {
                    tarjeta.classList.remove('flipped');
                }
            }, 1500);

        } else {
            tarjeta.classList.remove('flipped');
            if (temporizadorPista) clearTimeout(temporizadorPista);
        }
    }

   function monitorearEscritura() {
        if (esperandoSiguiente || mazoActual.length === 0) return;

        const inputUsuario = document.getElementById('user-input');
        const palabraActual = mazoActual[indiceActual];

        const respuestaFiltrada = inputUsuario.value.trim();
        const hanziCorrecto = palabraActual.h.trim();

        if (respuestaFiltrada === hanziCorrecto) {
            esperandoSiguiente = true;
            inputUsuario.disabled = true;

            if (temporizadorPista) clearTimeout(temporizadorPista);

            if (!tarjetaActualFuePenalizada) {
                const scoreCorrect = document.getElementById('score-correct');
                if (scoreCorrect) scoreCorrect.innerText = parseInt(scoreCorrect.innerText) + 1;
            }
            const tarjeta = document.getElementById('flashcard');
            tarjeta.classList.add('flipped');
            setTimeout(() => {
                tarjeta.classList.remove('flipped');
                setTimeout(() => {
                    avanzarSiguienteTarjeta();
                }, 600); 
            }, 1500); 
        }
    }

    function avanzarSiguienteTarjeta() {
        indiceActual++; 

        if (indiceActual >= mazoActual.length) {
            finalizarSesionEstudio();
        } else {
            mostrarTarjeta();
        }
    }
    

    function saltarTarjeta() {
    if (esperandoSiguiente || mazoActual.length === 0) return;

    const scoreWrong = document.getElementById('score-wrong');
    scoreWrong.innerText = parseInt(scoreWrong.innerText) + 1;

    if (!palabrasMalasRecolectadas.some(p => p.h === mazoActual[indiceActual].h)) {
        palabrasMalasRecolectadas.push(mazoActual[indiceActual]);
    }

    avanzarSiguienteTarjeta();
    }

    function finalizarSesionEstudio() {
        if (temporizadorPista) clearTimeout(temporizadorPista);
        
        document.getElementById('study-screen').style.display = 'none';
        
        document.getElementById('results-screen').style.display = 'flex';

        const correctasJuego = document.getElementById('score-correct').innerText;
        const totalMalas = palabrasMalasRecolectadas.length;

        document.getElementById('res-correctas').innerText = correctasJuego;
        document.getElementById('res-incorrectas').innerText = totalMalas;

        const btnRepasarMalas = document.getElementById('btn-retry-wrongs');
        if (btnRepasarMalas) {
            if (totalMalas > 0) {
                btnRepasarMalas.style.display = 'inline-block';
                btnRepasarMalas.innerText = `Repasar solo las malas (${totalMalas})`;
            } else {
                btnRepasarMalas.style.display = 'none';
            }
        }
    }

    function repasarSoloMalas() {
        if (palabrasMalasRecolectadas.length === 0) return;

        mazoActual = [...palabrasMalasRecolectadas];
        palabrasMalasRecolectadas = []; 
        indiceActual = 0;

        document.getElementById('score-correct').innerText = "0";
        document.getElementById('score-wrong').innerText = "0";

        document.getElementById('results-screen').style.display = 'none';
        document.getElementById('study-screen').style.display = 'block';

        mostrarTarjeta();
    }

    function regresarAlMenuCompleto() {
        document.getElementById('results-screen').style.display = 'none';
        document.getElementById('menu-screen').style.display = 'block';
        
        mazoActual = [];
        palabrasMalasRecolectadas = [];
        indiceActual = 0;
        esModoDesafioGlobal = false;
    }

    function regresarAlMenu() {
        if (temporizadorPista) clearTimeout(temporizadorPista);
        document.getElementById('study-screen').style.display = 'none';
        document.getElementById('menu-screen').style.display = 'block';
        esModoDesafioGlobal = false;
        cambiarModo('flashcards');
    }

    function cambiarPestaña(tipo) {
        if (tipo === 'niveles') {
            document.getElementById('tab-niveles').classList.add('active');
            document.getElementById('tab-prueba').classList.remove('active');
            document.getElementById('content-niveles').style.display = 'block';
            document.getElementById('content-prueba').style.display = 'none';
        } else {
            document.getElementById('tab-prueba').classList.add('active');
            document.getElementById('tab-niveles').classList.remove('active');
            document.getElementById('content-prueba').style.display = 'block';
            document.getElementById('content-niveles').style.display = 'none';
        }
    }
    const inputElement = document.getElementById('user-input');

    if (inputElement) {
    inputElement.addEventListener('focus', () => {
        setTimeout(() => {
            inputElement.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }, 300);
    });
    }
    function elegirMazo(mazo) {
    configuracionMemorice.mazo = mazo;
    cambiarPantalla('step-mazo', 'step-modo');
    }

    function elegirModo(modo) {
        configuracionMemorice.modo = modo;
        cambiarPantalla('step-modo', 'step-cantidad');
    }

    function elegirCantidad(cantidad) {
    configuracionMemorice.cantidad = cantidad;
    console.log("Configuración memorice guardada:", configuracionMemorice);
    document.getElementById('step-cantidad').style.display = 'none';
    iniciarMemorice(); 
}

    function cambiarPantalla(actual, siguiente) {
        document.getElementById(actual).style.display = 'none';
        document.getElementById(siguiente).style.display = 'block';
    }
    function mezclar(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] =
        [array[j], array[i]];
    }

    return array;
}
function prepararJuegoMemorice(nombreMazo, modo, numPares) {
    let mazo = baseDeDatosHSK.filter(p => p.cat === nombreMazo);
    let seleccion = mezclar([...mazo]).slice(0, numPares);
    
    let juego = [];
    seleccion.forEach(item => {
        juego.push({ id: `${item.h}-${item.p}`, texto: item.h });
        let valorPar = (modo === 'h-h') ? item.h : item.p;
        juego.push({ id: `${item.h}-${item.p}`, texto: valorPar });
    });
    
    return mezclar(juego);
}
    function cambiarModo(modo) {
    const pantallas = ['menu-screen', 'study-screen', 'memorice-screen'];
    pantallas.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    switch(modo) {
        case 'flashcards':
            document.getElementById('menu-screen').style.display = 'block';
            break;
        case 'memorice':
            resetearMemorice();
            const pantalla = document.getElementById('memorice-screen');
            pantalla.style.display = 'block';
            pantalla.classList.remove('screen-animation');
            void pantalla.offsetWidth;
            pantalla.classList.add('screen-animation');
            break;
        default:
            document.getElementById('menu-screen').style.display = 'block';
    }
    }
    
    function iniciarMemorice() {

    cartasVolteadas = [];
    bloqueandoTablero = false;

    const { mazo, modo, cantidad } = configuracionMemorice;

    const tablero = prepararJuegoMemorice(
        mazo,
        modo,
        cantidad
    );

    const grid = document.getElementById('grid-container');

    if (cantidad === 10) {
        grid.classList.remove('grid-15');
        grid.classList.add('grid-10');
    } else {
        grid.classList.remove('grid-10');
        grid.classList.add('grid-15');
    }

    grid.innerHTML = '';

    tablero.forEach((par) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.id = par.id;

        const claseTexto =
            modo === 'h-h'
                ? 'texto-hanzi'
                : 'texto-pinyin';

        card.innerHTML = `
            <span class="card-hidden"></span>
            <span class="card-text ${claseTexto}" style="display:none">
                ${par.texto}
            </span>
        `;

        card.addEventListener('click', () => voltearCarta(card));
        grid.appendChild(card);
    });

    document.getElementById('step-cantidad').style.display = 'none';
    document.getElementById('memorice-game').style.display = 'block';

    detenerTimer();
    document.getElementById('timer').innerText = '00:00';
    iniciarTimer();
}

    function voltearCarta(card) {
        console.log("Click en carta");
        if (
            bloqueandoTablero ||
            card.classList.contains('flipped') ||
            card.classList.contains('matched')
            
        ) return;
            
        card.classList.add('flipped');

        card.querySelector('.card-hidden').style.display = 'none';
        const texto = card.querySelector('span:last-child');
        texto.style.display = 'block';

        cartasVolteadas.push(card);

        if (cartasVolteadas.length === 2) {
            compararCartas();
        }
    }

    function compararCartas() {
        bloqueandoTablero = true;

        const [c1, c2] = cartasVolteadas;

        if (c1.dataset.id === c2.dataset.id) {

            c1.classList.add('matched');
            c2.classList.add('matched');
            c1.style.background = '#4CAF50';
            c2.style.background = '#4CAF50';

            const completadas =
            document.querySelectorAll('.card.matched').length;

            const total =
            document.querySelectorAll('.card').length;

                if (completadas === total) {

                    detenerTimer();

                    const tiempoFinal =
                        document.getElementById('timer').innerText;

                    document.getElementById(
                        'memorice-final-time'
                    ).innerText =
                        `Completaste el memorice en ${tiempoFinal}`;

                    document.getElementById(
                        'memorice-finish-modal'
                    ).style.display = 'flex';
                }

        cartasVolteadas = [];
        bloqueandoTablero = false;

    } else {

    c1.classList.add('error');
    c2.classList.add('error');

    setTimeout(() => {
        c1.classList.remove('error');
        c2.classList.remove('error');
    }, 250);

    setTimeout(() => {

        c1.classList.remove('flipped');
        c2.classList.remove('flipped');

        c1.querySelector('.card-hidden').style.display = 'block';
        c1.querySelector('.card-text').style.display = 'none';

        c2.querySelector('.card-hidden').style.display = 'block';
        c2.querySelector('.card-text').style.display = 'none';

        cartasVolteadas = [];
        bloqueandoTablero = false;

    }, 600);
}
}
    function volverA(pantallaAnterior) {
    document.querySelectorAll('.paso-memorice').forEach(p => p.style.display = 'none');
    document.getElementById(pantallaAnterior).style.display = 'block';
}
    function resetearMemorice() {

        configuracionMemorice = {
            mazo: null,
            modo: null,
            cantidad: null
        };

        cartasVolteadas = [];
        bloqueandoTablero = false;

        document.getElementById('step-mazo').style.display = 'block';
        document.getElementById('step-modo').style.display = 'none';
        document.getElementById('step-cantidad').style.display = 'none';
        document.getElementById('memorice-game').style.display = 'none';
        detenerTimer();
        document.getElementById('timer').innerText = "00:00";
}
    function iniciarTimer() {
    tiempoInicio = Date.now();

    intervaloTimer = setInterval(() => {

        const transcurrido =
            Math.floor((Date.now() - tiempoInicio) / 1000);

        const minutos =
            String(Math.floor(transcurrido / 60)).padStart(2, '0');

        const segundos =
            String(transcurrido % 60).padStart(2, '0');

        document.getElementById('timer').innerText =
            `${minutos}:${segundos}`;

    }, 1000);
}

    function detenerTimer() {
        clearInterval(intervaloTimer);
}
    function repetirMemorice() {

    document.getElementById(
        'memorice-finish-modal'
    ).style.display = 'none';

    iniciarMemorice();
}
    function volverMenuMemorice() {

    document.getElementById(
        'memorice-finish-modal'
    ).style.display = 'none';

    resetearMemorice();

    document.getElementById(
        'memorice-screen'
    ).style.display = 'block';
}
    function volverMenuPrincipal() {

    document.getElementById(
        'memorice-finish-modal'
    ).style.display = 'none';

    resetearMemorice();

    document.getElementById(
        'memorice-screen'
    ).style.display = 'none';

    document.getElementById(
        'menu-screen'
    ).style.display = 'block';
}