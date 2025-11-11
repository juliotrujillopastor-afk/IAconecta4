const filas = 6;
const columnas = 7;
let tablero = [];
let jugadorActual = 1; 
let juegoActivo = true;

const TABLERO_VACIO = 0;
const JUGADOR_HUMANO = 1;
const JUGADOR_IA = 2;

const tableroDiv = document.getElementById('juego-tablero');
const mensajeDiv = document.getElementById('mensaje');
const reiniciarBoton = document.getElementById('reiniciar');
const selectorDificultad = document.getElementById('dificultad'); 

// --- FUNCIONES DE INICIALIZACIÓN Y COLOCACIÓN ---

function crearTableroHTML() {
    tableroDiv.innerHTML = '';
    tablero = [];
    for (let r = 0; r < filas; r++) {
        tablero[r] = [];
        for (let c = 0; c < columnas; c++) {
            tablero[r][c] = TABLERO_VACIO;
            const celdaDiv = document.createElement('div');
            celdaDiv.classList.add('celda');
            celdaDiv.dataset.col = c;
            celdaDiv.addEventListener('click', () => manejarClick(c));
            tableroDiv.appendChild(celdaDiv);
        }
    }
}

function encontrarFilaLibre(col) {
    for (let r = filas - 1; r >= 0; r--) {
        if (tablero[r][col] === TABLERO_VACIO) {
            return r;
        }
    }
    return -1; // Columna llena
}

function colocarFicha(r, c, jugador) {
    tablero[r][c] = jugador;
    const celdaIndex = r * columnas + c;
    const celdaDiv = tableroDiv.children[celdaIndex];

    const fichaDiv = document.createElement('div');
    fichaDiv.classList.add('ficha', `jugador-${jugador}`);
    celdaDiv.appendChild(fichaDiv);
}

// --- LÓGICA DE JUEGO PRINCIPAL ---

function manejarClick(col) {
    if (!juegoActivo || jugadorActual !== JUGADOR_HUMANO) return;

    const filaLibre = encontrarFilaLibre(col);

    if (filaLibre !== -1) {
        colocarFicha(filaLibre, col, jugadorActual);
        
        if (chequearGanador(filaLibre, col, jugadorActual)) {
            finalizarJuego(`🎉 ¡Has ganado! 🎉`);
        } else if (esTableroLleno()) {
            finalizarJuego(`Empate`);
        } else {
            cambiarTurno();
            setTimeout(turnoOrdenador, 500);
        }
    }
}

function cambiarTurno() {
    jugadorActual = (jugadorActual === JUGADOR_HUMANO) ? JUGADOR_IA : JUGADOR_HUMANO;
    const nombreJugador = (jugadorActual === JUGADOR_HUMANO) ? 'Jugador (Rojo)' : 'IA (Amarillo)';
    mensajeDiv.textContent = `Turno de la ${nombreJugador}`;
}

function finalizarJuego(mensaje) {
    juegoActivo = false;
    mensajeDiv.textContent = mensaje;
}

function reiniciarJuego() {
    juegoActivo = true;
    jugadorActual = JUGADOR_HUMANO;
    crearTableroHTML();
    mensajeDiv.textContent = 'Turno del Jugador (Rojo)';
}

// --- LÓGICA DE TURNO DEL ORDENADOR ---

function turnoOrdenador() {
    if (!juegoActivo) return;

    const mejorCol = encontrarMejorMovimiento();
    const filaLibre = encontrarFilaLibre(mejorCol);

    if (filaLibre !== -1) {
        colocarFicha(filaLibre, mejorCol, JUGADOR_IA);

        if (chequearGanador(filaLibre, mejorCol, JUGADOR_IA)) {
            finalizarJuego(`🤖 ¡La IA ha ganado! 😭`);
        } else if (esTableroLleno()) {
            finalizarJuego(`Empate`);
        } else {
            cambiarTurno();
        }
    }
}

function encontrarMejorMovimiento() {
    let mejorValor = -Infinity;
    let mejorColumna = -1;
    
    // Obtiene el valor de profundidad del selector
    const profundidadSeleccionada = parseInt(selectorDificultad.value); 
    
    for (let c = 0; c < columnas; c++) {
        const r = encontrarFilaLibre(c);
        if (r !== -1) {
            tablero[r][c] = JUGADOR_IA;
            
            // Usar la profundidad seleccionada
            const valor = minimax(tablero, profundidadSeleccionada, -Infinity, Infinity, false); 
            
            tablero[r][c] = TABLERO_VACIO; // Deshacer el movimiento
            
            if (valor > mejorValor) {
                mejorValor = valor;
                mejorColumna = c;
            }
        }
    }
    // Prioridad al centro si no hay jugada mejor clara
    return (mejorColumna !== -1) ? mejorColumna : 
                                   (encontrarFilaLibre(3) !== -1 ? 3 : 
                                   (encontrarFilaLibre(0) !== -1 ? 0 : 
                                   0)); 
}


// --- ALGORITMO MINIMAX ---

function minimax(simTablero, profundidad, alfa, beta, esTurnoMaximizador) {
    const movimientosValidos = obtenerMovimientosValidos(simTablero);
    
    // 1. Caso Base
    if (profundidad === 0 || movimientosValidos.length === 0 || obtenerGanadorSimulacion(simTablero) !== TABLERO_VACIO) {
        if (obtenerGanadorSimulacion(simTablero) === JUGADOR_IA) {
            return 100000000000000 + profundidad; // La IA gana
        } else if (obtenerGanadorSimulacion(simTablero) === JUGADOR_HUMANO) {
            return -100000000000000 - profundidad; // El humano gana
        } else {
            return 0; // Empate
        }
    }

    if (esTurnoMaximizador) { // Turno de la IA (Maximizador)
        let mejorValor = -Infinity;
        for (let c of movimientosValidos) {
            const r = encontrarFilaLibreSim(simTablero, c);
            simTablero[r][c] = JUGADOR_IA;
            const valor = minimax(simTablero, profundidad - 1, alfa, beta, false);
            simTablero[r][c] = TABLERO_VACIO;
            
            mejorValor = Math.max(mejorValor, valor);
            alfa = Math.max(alfa, mejorValor);
            if (beta <= alfa) break; 
        }
        return mejorValor;
    } else { // Turno del Jugador Humano (Minimizador)
        let mejorValor = Infinity;
        for (let c of movimientosValidos) {
            const r = encontrarFilaLibreSim(simTablero, c);
            simTablero[r][c] = JUGADOR_HUMANO;
            const valor = minimax(simTablero, profundidad - 1, alfa, beta, true);
            simTablero[r][c] = TABLERO_VACIO;
            
            mejorValor = Math.min(mejorValor, valor);
            beta = Math.min(beta, mejorValor);
            if (beta <= alfa) break;
        }
        return mejorValor;
    }
}

// --- FUNCIONES AUXILIARES DE SIMULACIÓN ---

function obtenerMovimientosValidos(simTablero) {
    const validas = [];
    for (let c = 0; c < columnas; c++) {
        if (encontrarFilaLibreSim(simTablero, c) !== -1) {
            validas.push(c);
        }
    }
    return validas;
}

function encontrarFilaLibreSim(simTablero, col) {
    for (let r = filas - 1; r >= 0; r--) {
        if (simTablero[r][col] === TABLERO_VACIO) {
            return r;
        }
    }
    return -1;
}

function obtenerGanadorSimulacion(simTablero) {
    for (let r = 0; r < filas; r++) {
        for (let c = 0; c < columnas; c++) {
            if (simTablero[r][c] !== TABLERO_VACIO) {
                if (chequearGanadorSim(simTablero, r, c, simTablero[r][c])) {
                    return simTablero[r][c];
                }
            }
        }
    }
    return TABLERO_VACIO;
}

// --- LÓGICA DE CHEQUEO DE GANADOR COMPLETA Y CORREGIDA ---

function chequearGanador(r, c, jugador) {
    const direcciones = [
        [0, 1],   // Horizontal
        [1, 0],   // Vertical
        [1, 1],   // Diagonal (abajo-derecha)
        [1, -1]   // Diagonal (abajo-izquierda)
    ];

    for (const [dr, dc] of direcciones) {
        let conteo = 1; 
        
        // 1. Contar en la dirección positiva
        for (let i = 1; i < 4; i++) {
            const nuevaFila = r + dr * i;
            const nuevaCol = c + dc * i;
            
            if (nuevaFila >= 0 && nuevaFila < filas && 
                nuevaCol >= 0 && nuevaCol < columnas && 
                tablero[nuevaFila][nuevaCol] === jugador) {
                conteo++;
            } else {
                break;
            }
        }

        if (conteo >= 4) return true;

        // 2. Contar en la dirección negativa
        conteo = 1;

        for (let i = 1; i < 4; i++) {
            const nuevaFila = r - dr * i;
            const nuevaCol = c - dc * i;
            
            if (nuevaFila >= 0 && nuevaFila < filas && 
                nuevaCol >= 0 && nuevaCol < columnas && 
                tablero[nuevaFila][nuevaCol] === jugador) {
                conteo++;
            } else {
                break;
            }
        }
        
        if (conteo >= 4) return true;
    }
    
    return false;
}


function chequearGanadorSim(simTablero, r, c, jugador) {
    const direcciones = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1]
    ];

    for (const [dr, dc] of direcciones) {
        let conteo = 1; 
        
        // 1. Contar en la dirección positiva
        for (let i = 1; i < 4; i++) {
            const nuevaFila = r + dr * i;
            const nuevaCol = c + dc * i;
            
            if (nuevaFila >= 0 && nuevaFila < filas && 
                nuevaCol >= 0 && nuevaCol < columnas && 
                simTablero[nuevaFila][nuevaCol] === jugador) {
                conteo++;
            } else {
                break;
            }
        }
        
        // 2. Contar en la dirección negativa
        for (let i = 1; i < 4; i++) {
            const nuevaFila = r - dr * i;
            const nuevaCol = c - dc * i;
            
            if (nuevaFila >= 0 && nuevaFila < filas && 
                nuevaCol >= 0 && nuevaCol < columnas && 
                simTablero[nuevaFila][nuevaCol] === jugador) {
                conteo++;
            } else {
                break;
            }
        }
        
        if (conteo >= 4) return true;
    }
    
    return false;
}


function esTableroLleno() {
    return tablero[0].every(celda => celda !== TABLERO_VACIO);
}

// --- INICIO DEL JUEGO ---
selectorDificultad.addEventListener('change', reiniciarJuego);
reiniciarBoton.addEventListener('click', reiniciarJuego);
reiniciarJuego();