// --- CONFIGURACIÓN DEL JUEGO ---
const FILAS = 6;
const COLUMNAS = 7;
const VACIO = 0;
const JUGADOR = 1; // Humano (Amarillo)
const IA = 2;      // Ordenador (Rojo)
const PROFUNDIDAD_IA = 6; 

// Variables de estado del juego
let tablero;
let juegoActivo = true;
let jugadorActual = JUGADOR;

// Elementos del DOM (Declarados aquí, pero se asignarán valores en DOMContentLoaded)
// Esto soluciona el problema de "null"
let statusMessage, gameBoardEl, dropZoneEl, restartButton; 

// --- INICIALIZACIÓN ---

/**
 * Inicializa el tablero lógico y el visual.
 */
function iniciarJuego() {
    tablero = Array(FILAS).fill(0).map(() => Array(COLUMNAS).fill(VACIO));
    juegoActivo = true;
    jugadorActual = JUGADOR;

    // Verificar que los elementos DOM existan antes de manipularlos
    if (!gameBoardEl || !dropZoneEl) return; 
    
    // Limpiar el tablero
    gameBoardEl.innerHTML = '';
    dropZoneEl.innerHTML = '';

    // Crear las 42 celdas visuales (fondo azul con agujeros blancos)
    for (let r = 0; r < FILAS; r++) {
        for (let c = 0; c < COLUMNAS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            gameBoardEl.appendChild(cell);
        }
    }

    // Crear las 7 áreas de clic para soltar las fichas
    for (let c = 0; c < COLUMNAS; c++) {
        const dropCol = document.createElement('div');
        dropCol.classList.add('drop-column');
        dropCol.dataset.col = c;
        // El listener de clic: esencial para que la mano funcione.
        dropCol.addEventListener('click', () => manejarMovimiento(c)); 
        dropZoneEl.appendChild(dropCol);
    }

    actualizarMensajeEstado();
}

/**
 * Muestra el mensaje de estado actual (Turno o Ganador).
 */
function actualizarMensajeEstado() {
    if (!statusMessage) return;
    if (!juegoActivo) return;
    statusMessage.textContent = 
        jugadorActual === JUGADOR 
        ? "Turno del Jugador (Tú - Amarillo 🟡)"
        : "Turno del Ordenador (Rojo 🔴)";
}

// --- LÓGICA DE MOVIMIENTO ---

/**
 * Encuentra la primera fila VACIA en una columna dada.
 */
function obtenerFilaDisponible(col) {
    for (let r = FILAS - 1; r >= 0; r--) {
        if (tablero[r][col] === VACIO) {
            return r;
        }
    }
    return -1;
}

/**
 * Coloca una ficha en la representación lógica del tablero y la actualiza visualmente.
 */
function colocarFicha(r, c, jugador) {
    tablero[r][c] = jugador;

    const cellEl = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    if (cellEl) {
        const chip = document.createElement('div');
        chip.classList.add('chip', jugador === JUGADOR ? 'player1' : 'player2');
        cellEl.appendChild(chip);
    }
}

/**
 * Maneja un movimiento completo.
 */
async function manejarMovimiento(c) {
    // Diagnóstico en consola: Si ves estos logs, la función fue llamada correctamente.
    console.log("------------------------");
    console.log(`Clic en columna: ${c}`);
    console.log(`Juego Activo: ${juegoActivo}`);
    console.log(`Turno Actual: ${jugadorActual === JUGADOR ? 'Jugador (1)' : 'IA (2)'}`);

    if (!juegoActivo) {
        console.log("Bloqueado: El juego no está activo.");
        return;
    }
    
    if (jugadorActual !== JUGADOR) {
        console.log("Bloqueado: No es el turno del jugador humano.");
        return;
    }

    const r = obtenerFilaDisponible(c);
    console.log(`Fila disponible (r): ${r}`);

    if (r !== -1) {
        colocarFicha(r, c, JUGADOR);

        if (comprobarVictoria(r, c, JUGADOR)) {
            finalizarJuego("¡Felicidades! ¡Has ganado! 🎉");
            return;
        }

        if (obtenerMovimientosValidos().length === 0) {
            finalizarJuego("¡Es un empate! 🤝");
            return;
        }

        // 1. Cambiar al turno de la IA y bloquear clics
        jugadorActual = IA;
        actualizarMensajeEstado();
        juegoActivo = false; 

        // 2. Ejecutar el movimiento de la IA después de un breve retraso
        await new Promise(resolve => setTimeout(resolve, 800));
        movimientoIA();
    } else {
        console.log("Columna llena. No se puede colocar ficha.");
    }
}

/**
 * Lógica principal del movimiento de la IA (Algoritmo Minimax).
 */
function movimientoIA() {
    const mejorMovimiento = encontrarMejorMovimiento(tablero, PROFUNDIDAD_IA);
    const c = mejorMovimiento.col;
    const r = obtenerFilaDisponible(c);

    if (r !== -1) {
        colocarFicha(r, c, IA);

        if (comprobarVictoria(r, c, IA)) {
            finalizarJuego("¡El Ordenador ha ganado! 🤖");
            return;
        }

        if (obtenerMovimientosValidos().length === 0) {
            finalizarJuego("¡Es un empate! 🤝");
            return;
        }

        // Cambiar al turno del jugador humano
        jugadorActual = JUGADOR;
        juegoActivo = true;
        actualizarMensajeEstado();
    }
}

// --- LÓGICA DE VERIFICACIÓN (Funciones Auxiliares) ---

function obtenerMovimientosValidos() {
    const validas = [];
    for (let c = 0; c < COLUMNAS; c++) {
        if (obtenerFilaDisponible(c) !== -1) {
            validas.push(c);
        }
    }
    return validas;
}

function comprobarVictoria(r, c, jugador) {
    const ficha = tablero[r][c];
    const direcciones = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dr, dc] of direcciones) {
        let contador = 1;
        // Positivo
        for (let i = 1; i <= 3; i++) {
            const nr = r + dr * i;
            const nc = c + dc * i;
            if (nr >= 0 && nr < FILAS && nc >= 0 && nc < COLUMNAS && tablero[nr][nc] === ficha) {
                contador++;
            } else {
                break;
            }
        }
        // Negativo
        for (let i = 1; i <= 3; i++) {
            const nr = r - dr * i;
            const nc = c - dc * i;
            if (nr >= 0 && nr < FILAS && nc >= 0 && nc < COLUMNAS && tablero[nr][nc] === ficha) {
                contador++;
            } else {
                break;
            }
        }
        if (contador >= 4) {
            return true;
        }
    }
    return false;
}

function finalizarJuego(mensaje) {
    juegoActivo = false;
    if (statusMessage) statusMessage.textContent = mensaje;
}

// --- ALGORITMO MINIMAX (IA) ---
// (Contenido del Minimax y funciones auxiliares, omitido por longitud,
// pero debe estar completo aquí como en el código original)
function minimax(board, profundidad, esTurnoMax) {
    // ... Implementación completa de minimax ...
    const movimientosValidos = obtenerMovimientosValidosMinimax(board);

    if (profundidad === 0 || movimientosValidos.length === 0 || verificarTerminal(board).esTerminal) {
        const estadoTerminal = verificarTerminal(board);
        if (estadoTerminal.esTerminal) {
            if (estadoTerminal.ganador === IA) return { score: 100000000000000 }; 
            if (estadoTerminal.ganador === JUGADOR) return { score: -100000000000000 }; 
            return { score: 0 }; 
        } else {
            return { score: evaluarTablero(board) };
        }
    }

    if (esTurnoMax) {
        let valor = -Infinity;
        let mejorColumna = movimientosValidos[0];

        for (const col of movimientosValidos) {
            const copiaTablero = duplicarTablero(board);
            const fila = obtenerFilaDisponibleMinimax(copiaTablero, col);
            copiaTablero[fila][col] = IA;
            
            const nuevoValor = minimax(copiaTablero, profundidad - 1, false).score;
            
            if (nuevoValor > valor) {
                valor = nuevoValor;
                mejorColumna = col;
            }
        }
        return { score: valor, col: mejorColumna };

    } else {
        let valor = Infinity;
        let mejorColumna = movimientosValidos[0];

        for (const col of movimientosValidos) {
            const copiaTablero = duplicarTablero(board);
            const fila = obtenerFilaDisponibleMinimax(copiaTablero, col);
            copiaTablero[fila][col] = JUGADOR;
            
            const nuevoValor = minimax(copiaTablero, profundidad - 1, true).score;
            
            if (nuevoValor < valor) {
                valor = nuevoValor;
                mejorColumna = col;
            }
        }
        return { score: valor, col: mejorColumna };
    }
}

function encontrarMejorMovimiento(board, profundidad) {
    return minimax(board, profundidad, true);
}

function duplicarTablero(board) {
    return board.map(arr => [...arr]);
}

function obtenerFilaDisponibleMinimax(board, col) {
    for (let r = FILAS - 1; r >= 0; r--) {
        if (board[r][col] === VACIO) {
            return r;
        }
    }
    return -1;
}

function obtenerMovimientosValidosMinimax(board) {
    const validas = [];
    for (let c = 0; c < COLUMNAS; c++) {
        if (obtenerFilaDisponibleMinimax(board, c) !== -1) {
            validas.push(c);
        }
    }
    return validas;
}

function verificarTerminal(board) {
    for (let r = 0; r < FILAS; r++) {
        for (let c = 0; c < COLUMNAS; c++) {
            if (board[r][c] !== VACIO) {
                if (esGanador(board, r, c, board[r][c])) {
                    return { esTerminal: true, ganador: board[r][c] };
                }
            }
        }
    }
    if (obtenerMovimientosValidosMinimax(board).length === 0) {
        return { esTerminal: true, ganador: VACIO };
    }
    return { esTerminal: false, ganador: VACIO };
}

function esGanador(board, r, c, jugador) {
    const direcciones = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];
    for (const [dr, dc] of direcciones) {
        let contador = 1;
        for (let i = 1; i <= 3; i++) {
            const nr = r + dr * i;
            const nc = c + dc * i;
            if (nr >= 0 && nr < FILAS && nc >= 0 && nc < COLUMNAS && board[nr][nc] === jugador) {
                contador++;
            } else {
                break;
            }
        }
        for (let i = 1; i <= 3; i++) {
            const nr = r - dr * i;
            const nc = c - dc * i;
            if (nr >= 0 && nr < FILAS && nc >= 0 && nc < COLUMNAS && board[nr][nc] === jugador) {
                contador++;
            } else {
                break;
            }
        }
        if (contador >= 4) return true;
    }
    return false;
}

function evaluarTablero(board) {
    let puntuacion = 0;
    for (let r = 0; r < FILAS; r++) {
        for (let c = 0; c < COLUMNAS; c++) {
            if (board[r][c] === IA) {
                puntuacion += evaluarSecuencia(board, r, c, IA);
            } else if (board[r][c] === JUGADOR) {
                puntuacion -= evaluarSecuencia(board, r, c, JUGADOR);
            }
        }
    }
    return puntuacion;
}

function evaluarSecuencia(board, r, c, jugador) {
    let score = 0;
    const direcciones = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dr, dc] of direcciones) {
        let contador = 0;
        let celdasAbiertas = 0;

        for (let i = 1; i <= 3; i++) {
            const nr = r + dr * i;
            const nc = c + dc * i;
            if (nr < 0 || nr >= FILAS || nc < 0 || nc >= COLUMNAS) break;

            if (board[nr][nc] === jugador) {
                contador++;
            } else if (board[nr][nc] === VACIO) {
                celdasAbiertas++;
            } else {
                break;
            }
        }

        if (contador === 2 && celdasAbiertas >= 2) {
            score += 10;
        } else if (contador === 3 && celdasAbiertas >= 1) {
            score += 1000;
        }
    }
    return score;
}
// --- FIN ALGORITMO MINIMAX ---


// --- EVENT LISTENERS Y ARRANQUE (SECCIÓN CORREGIDA) ---

document.addEventListener('DOMContentLoaded', () => {
    // 🥇 ASIGNAR LAS VARIABLES GLOBALES UNA VEZ QUE EL DOM ESTÁ LISTO
    statusMessage = document.getElementById('status-message');
    gameBoardEl = document.getElementById('game-board');
    dropZoneEl = document.getElementById('drop-zone');
    restartButton = document.getElementById('restart-button');

    // 2. Asignar el listener al botón de reiniciar.
    if (restartButton) {
        restartButton.addEventListener('click', iniciarJuego);
    }
    
    // 3. Iniciar el juego por primera vez.
    iniciarJuego();
});