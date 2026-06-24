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
    function cambiarModo(modo) {
    const pantallas = ['menu-screen', 'study-screen', 'frases-screen', 'tonos-screen'];
    pantallas.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    switch(modo) {
        case 'flashcards':
            document.getElementById('menu-screen').style.display = 'block';
            break;
        case 'frases':
            document.getElementById('frases-screen').style.display = 'block';
            if (typeof iniciarModoFrases === 'function') {
                iniciarModoFrases();
            }
            break;
        case 'tonos':
            document.getElementById('tonos-screen').style.display = 'block';
            if (typeof iniciarModoTonos === 'function') {
                iniciarModoTonos();
            }
            break;
        default:
            document.getElementById('menu-screen').style.display = 'block';
    }
    }
