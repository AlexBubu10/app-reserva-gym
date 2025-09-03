import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCHfz93Cz8TcfCyFutJa1QnJjLTxWFEs0E",
  authDomain: "appreservas-46f39.firebaseapp.com",
  projectId: "appreservas-46f39",
  storageBucket: "appreservas-46f39.firebasestorage.app",
  messagingSenderId: "948518294471",
  appId: "1:948518294471:web:a2d372c94ed8f73d25bfe2",
  measurementId: "G-TMFHR2VE82"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== NUEVA FUNCIÓN PARA FORMATEAR FECHAS SIN ZONA HORARIA =====
function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses son 0-indexados
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


document.addEventListener('DOMContentLoaded', function() {
    const adminScheduleContainer = document.getElementById('admin-schedule-container');
    const currentDateEl = document.getElementById('current-date');
    const deleteModal = document.getElementById('delete-confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const deleteConfirmText = document.getElementById('delete-confirmation-text');

    let reservationIdToDelete = null;

    function setCurrentDate() {
        const today = new Date();
        currentDateEl.textContent = today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    function fetchAndRenderReservations() {
        // ===== USAMOS LA NUEVA FUNCIÓN DE FECHA =====
        const today = getLocalDateString(new Date());
        const reservationsRef = collection(db, 'reservations');
        const q = query(reservationsRef, where("date", "==", today));

        onSnapshot(q, (snapshot) => {
            const bookingsByTime = {};
            snapshot.forEach(doc => {
                const booking = doc.data();
                if (!bookingsByTime[booking.time]) {
                    bookingsByTime[booking.time] = [];
                }
                bookingsByTime[booking.time].push({ id: doc.id, ...booking });
            });
            renderAdminSchedule(bookingsByTime);
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
            
            const userList = bookingsByTime[time].map(booking => `
                <li class="flex justify-between items-center py-2">
                    <span>${booking.name}</span>
                    <div class="flex items-center gap-4">
                        <span class="text-cyan-400 text-sm font-semibold bg-gray-700 px-2 py-1 rounded">${booking.activity}</span>
                        <button class="delete-btn" data-id="${booking.id}" data-name="${booking.name}" title="Eliminar reserva">
                            <svg class="h-5 w-5 text-gray-500 hover:text-red-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </li>`
            ).join('');

            card.innerHTML = `
                <h3 class="text-xl font-bold text-white mb-3 pb-2 border-b border-gray-700">${time}hs</h3>
                <ul class="text-gray-300 divide-y divide-gray-700">${userList}</ul>
            `;
            adminScheduleContainer.appendChild(card);
        });
    }

    adminScheduleContainer.addEventListener('click', (e) => {
        // ... (sin cambios)
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            reservationIdToDelete = deleteButton.dataset.id;
            const userName = deleteButton.dataset.name;
            deleteConfirmText.textContent = `¿Estás seguro de que querés eliminar la reserva de ${userName}? Esta acción no se puede deshacer.`;
            deleteModal.classList.remove('hidden');
        }
    });

    cancelDeleteBtn.addEventListener('click', () => {
        // ... (sin cambios)
        deleteModal.classList.add('hidden');
        reservationIdToDelete = null;
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        // ... (sin cambios)
        if (reservationIdToDelete) {
            try {
                const docRef = doc(db, 'reservations', reservationIdToDelete);
                await deleteDoc(docRef);
                console.log("Reserva eliminada con éxito");
            } catch (error) {
                console.error("Error al eliminar la reserva: ", error);
                alert("No se pudo eliminar la reserva. Intentá de nuevo.");
            } finally {
                deleteModal.classList.add('hidden');
                reservationIdToDelete = null;
            }
        }
    });

    setCurrentDate();
    fetchAndRenderReservations();
});
