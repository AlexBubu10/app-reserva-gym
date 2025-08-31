import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==================================================================
//  CONFIGURACIÓN DE FIREBASE (CON CORRECCIÓN)
// ==================================================================
const firebaseConfig = {
  // CORRECCIÓN: Se eliminó la 'a' extra de 'aapiKey'.
  apiKey: "AIzaSyCHfz93Cz8TcfCyFutJa1QnJjLTxWFEs0E",
  authDomain: "appreservas-46f39.firebaseapp.com",
  projectId: "appreservas-46f39",
  storageBucket: "appreservas-46f39.firebasestorage.app",
  messagingSenderId: "948518294471",
  appId: "1:948518294471:web:a2d372c94ed8f73d25bfe2",
  measurementId: "G-TMFHR2VE82"
};
// ==================================================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', function() {
    const adminScheduleContainer = document.getElementById('admin-schedule-container');
    const currentDateEl = document.getElementById('current-date');

    function setCurrentDate() {
        const today = new Date();
        currentDateEl.textContent = today.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function fetchAndRenderReservations() {
        const today = new Date().toISOString().split('T')[0];
        const reservationsRef = collection(db, 'reservations');
        const q = query(reservationsRef, where("date", "==", today));

        onSnapshot(q, (snapshot) => {
            const bookingsByTime = {};
            if (snapshot.empty) {
                renderAdminSchedule(bookingsByTime);
                return;
            }
            snapshot.forEach(doc => {
                const booking = doc.data();
                if (!bookingsByTime[booking.time]) {
                    bookingsByTime[booking.time] = [];
                }
                bookingsByTime[booking.time].push({ id: doc.id, ...booking });
            });
            renderAdminSchedule(bookingsByTime);
        }, (error) => {
            console.error("Error al obtener las reservas:", error);
            adminScheduleContainer.innerHTML = '<div class="bg-gray-800 p-6 rounded-lg text-center text-red-400">Error al conectar con la base de datos. Verificá la configuración de Firebase y las reglas de seguridad.</div>';
        });
    }

    function renderAdminSchedule(bookingsByTime) {
        if (Object.keys(bookingsByTime).length === 0) {
            adminScheduleContainer.innerHTML = '<div class="bg-gray-800 p-6 rounded-lg text-center text-gray-400">No hay reservas para hoy.</div>';
            return;
        }

        adminScheduleContainer.innerHTML = '';
        Object.keys(bookingsByTime).sort().forEach(time => {
            const card = document.createElement('div');
            card.className = 'bg-gray-800 p-4 rounded-lg shadow-lg';
            
            const userList = bookingsByTime[time].map(booking =>
                `<li class="flex justify-between items-center py-2">
                    <span>${booking.name}</span>
                    <span class="text-cyan-400 text-sm font-semibold bg-gray-700 px-2 py-1 rounded">${booking.activity}</span>
                </li>`
            ).join('');

            card.innerHTML = `
                <h3 class="text-xl font-bold text-white mb-3 pb-2 border-b border-gray-700">${time}hs</h3>
                <ul class="text-gray-300 divide-y divide-gray-700">${userList}</ul>
            `;
            adminScheduleContainer.appendChild(card);
        });
    }

    setCurrentDate();
    fetchAndRenderReservations();
});
