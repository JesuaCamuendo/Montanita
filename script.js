// Importa los módulos de Firebase (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, updateDoc, doc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. TU CONFIGURACIÓN (Pega aquí la que te dé Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyCNza8P_0oM3TCqxbg16uZyG1UEcJmM1gw",
    authDomain: "montanita-f221d.firebaseapp.com",
    projectId: "montanita-f221d",
    storageBucket: "montanita-f221d.firebasestorage.app",
    messagingSenderId: "116965842997",
    appId: "1:116965842997:web:83ff3f9f4c4d824a4c517c"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const historiasRef = collection(db, "historias");

// --- LÓGICA DEL MODAL ---
const modal = document.getElementById("modalHistoria");
const btnAbrir = document.querySelector(".fab-post");
const btnCerrar = document.querySelector(".close-btn");

btnAbrir.onclick = () => modal.style.display = "block";
btnCerrar.onclick = () => modal.style.display = "none";

// --- GUARDAR HISTORIA ---
document.getElementById("storyForm").onsubmit = async (e) => {
    e.preventDefault();
    
    const nombreInput = document.getElementById("autor").value.trim();
    const nuevaHistoria = {
        autor: nombreInput === "" ? "Anónimo" : nombreInput, // Lógica de nombre X o Anónimo
        categoria: document.getElementById("categoria").value,
        contenido: document.getElementById("contenido").value,
        fecha: serverTimestamp(),
        fuegos: 0 // Hora oficial del servidor de Google
    };

    try {
        await addDoc(historiasRef, nuevaHistoria);
        alert("¡Tu historia se queda en Montañita! 🔥");
        modal.style.display = "none";
        document.getElementById("storyForm").reset();
    } catch (error) {
        console.error("Error al guardar: ", error);
        alert("Algo falló en la matrix de Montañita.");
    }
};

// --- LEER HISTORIAS EN TIEMPO REAL ---
const feed = document.querySelector(".feed");

const q = query(historiasRef, orderBy("fuegos", "desc"),orderBy("fecha", "desc"));

onSnapshot(q, { includeMetadataChanges: false }, (snapshot) => {
    console.log("¿Hay datos en el snapshot?", !snapshot.empty);
    
    feed.innerHTML = ""; // Limpiar feed

    snapshot.forEach((doc) => {
        const h = doc.data();
        
        // Verificación de seguridad: si la fecha aún no llega del servidor, saltamos este doc
        if (!h.fecha) return; 

        console.log("Cargando historia de:", h.autor);

        const postHTML = `
            <article class="post-card">
                <div class="category-tag tag-${h.categoria}">${h.categoria}</div>
                <p>"${h.contenido}"</p>
                <span class="author">- ${h.autor}</span>
                <div class="actions">
                    <button class="btn-love">🔥</button>
                </div>
            </article>
        `;
        feed.innerHTML += postHTML;
    });
    
    if (snapshot.empty) {
        feed.innerHTML = "<p style='text-align:center;'>Aún no hay historias... ¡Sé el primero en soltar el chisme!</p>";
    }
}, (error) => {
    // ESTO ES VITAL: Si hay un error de índice o permisos, aquí te lo dirá
    console.error("Error en el snapshot:", error);
});

// Variable para guardar el "des--suscriptor" de Firebase
let unsubscribe = null;

function cargarHistorias(categoriaFiltro = "inicio") {
    if (unsubscribe) {
        unsubscribe();
    }

    let q;
    if (categoriaFiltro === "inicio") {
        // Ranking global: Más fuegos primero, luego más recientes
        q = query(
            historiasRef, 
            orderBy("fuegos", "desc"), 
            orderBy("fecha", "desc")
        );
    } else {
        // Ranking por categoría: Filtra y luego ordena por fuego
        q = query(
            historiasRef, 
            where("categoria", "==", categoriaFiltro), 
            orderBy("fuegos", "desc"), 
            orderBy("fecha", "desc")
        );
    }

    unsubscribe = onSnapshot(q, (snapshot) => {
        feed.innerHTML = "";
        
        if (snapshot.empty) {
            feed.innerHTML = `<p style="text-align:center; padding:20px; color: var(--sand);">Nadie ha contado chismes de "${categoriaFiltro}" todavía... ¡Sé el primero!</p>`;
            return;
        }

        snapshot.forEach((doc) => {
            const h = doc.data();
            const id = doc.id;
            
            // Si la fecha aún es nula (mientras sube al servidor), saltamos este registro
            if (!h.fecha) return; 

            const postHTML = `
                <article class="post-card">
                    <div class="category-tag tag-${h.categoria}">${h.categoria}</div>
                    <p>"${h.contenido}"</p>
                    <span class="author">- ${h.autor}</span>
                    <div class="actions">
                        <button class="btn-love" onclick="darFuego('${id}')">
                            🔥 <span>${h.fuegos || 0}</span>
                        </button>
                    </div>
                </article>
            `;
            feed.innerHTML += postHTML;
        });
    }, (error) => {
        console.error("Error detallado en Firebase:", error);
    });
}

// --- EVENTOS DE LOS BOTONES DE FILTRO ---
const botonesFiltro = document.querySelectorAll(".filter-btn");

botonesFiltro.forEach(boton => {
    boton.addEventListener("click", (e) => {
        e.preventDefault();
        
        // Cambiar la clase 'active' visualmente
        botonesFiltro.forEach(b => b.classList.remove("active"));
        boton.classList.add("active");

        // Cargar historias de esa categoría
        const cat = boton.getAttribute("data-category");
        cargarHistorias(cat);
    });
});

// Carga inicial al abrir la web
cargarHistorias();

window.darFuego = async (id) => {
    // Hace que el celular vibre por 50 milisegundos
    if (navigator.vibrate) {
        navigator.vibrate(50); 
    }

    const docRef = doc(db, "historias", id);
    try {
        await updateDoc(docRef, {
            fuegos: increment(1)
        });
    } catch (error) {
        console.error("Error al dar fuego:", error);
    }
};

const music = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicToggle");
const musicStatus = document.getElementById("musicStatus");

musicBtn.onclick = () => {
    if (music.paused) {
        music.play().then(() => {
            musicStatus.innerText = "Tú si eres de los míos";
            musicBtn.style.background = "#ff4d6d"; 
            musicBtn.style.color = "white";
        }).catch(error => {
            console.log("El navegador bloqueó el audio:", error);
        });
    } else {
        music.pause();
        musicStatus.innerText = "NO PRESIONES AQUÍ";
        musicBtn.style.background = "white";
        musicBtn.style.color = "black";
    }
};
