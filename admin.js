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

function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

document.addEventListener('DOMContentLoaded', function() {
    // Selectores del DOM
    const adminScheduleContainer = document.getElementById('admin-schedule-container');
    const datePicker = document.getElementById('date-picker');
    const deleteModal = document.getElementById('delete-confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const deleteConfirmText = document.getElementById('delete-confirmation-text');

    let reservationIdToDelete = null;
    let unsubscribe; // Para manejar la escucha de Firebase

    // ===== LÓGICA PRINCIPAL =====

    // 1. Establece la fecha de hoy en el selector por defecto
    datePicker.value = getLocalDateString(new Date());

    // 2. Escucha los cambios en el selector de fecha para refrescar los datos
    datePicker.addEventListener('change', fetchAndRenderReservations);

    // 3. Función para buscar y mostrar las reservas del día seleccionado
    function fetchAndRenderReservations() {
        const selectedDate = datePicker.value;
        if (!selectedDate) return;

        // Si ya hay una escucha activa, la cancelamos antes de crear una nueva
        if (unsubscribe) {
            unsubscribe();
        }

        const reservationsRef = collection(db, 'reservations');
        const q = query(reservationsRef, where("date", "==", selectedDate));

        // onSnapshot escucha los cambios en tiempo real
        unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingsByActivity = {};
            snapshot.forEach(doc => {
                const booking = doc.data();
                const { activity, time } = booking;
                if (!bookingsByActivity[activity]) {
                    bookingsByActivity[activity] = {};
                }
                if (!bookingsByActivity[activity][time]) {
                    bookingsByActivity[activity][time] = [];
                }
                bookingsByActivity[activity][time].push({ id: doc.id, ...booking });
            });
            renderAdminSchedule(bookingsByActivity);
        });
    }

    // 4. Función para "dibujar" el calendario agrupado en la pantalla
    function renderAdminSchedule(bookingsByActivity) {
        if (Object.keys(bookingsByActivity).length === 0) {
            adminScheduleContainer.innerHTML = `<div class="bg-gray-800 p-6 rounded-lg text-center text-gray-400">No hay reservas para la fecha seleccionada.</div>`;
            return;
        }

        adminScheduleContainer.innerHTML = '';
        Object.keys(bookingsByActivity).sort().forEach(activity => {
            const activityCard = document.createElement('div');
            activityCard.className = 'bg-gray-800 p-4 rounded-lg shadow-lg';

            let timeSlotsHtml = '';
            Object.keys(bookingsByActivity[activity]).sort().forEach(time => {
                // ===== CORRECCIÓN DE DISEÑO AQUÍ =====
                const userList = bookingsByActivity[activity][time].map(booking => `
                    <li class="flex justify-between items-center py-2 group">
                        <span>${booking.name}</span>
                        <button class="delete-btn p-1 rounded-full hover:bg-gray-700 transition-colors" data-id="${booking.id}" data-name="${booking.name}" title="Eliminar reserva">
                            <svg class="h-5 w-5 text-gray-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </li> 
                `).join(''); // Se corrigió </div> por </li>

                timeSlotsHtml += `
                    <div class="mt-3">
                        <h4 class="text-md font-semibold text-cyan-400">${time}hs</h4>
                        <ul class="text-gray-300 divide-y divide-gray-700">${userList}</ul>
                    </div>
                `;
            });
            
            activityCard.innerHTML = `
                <h3 class="text-xl font-bold text-white mb-2 pb-2 border-b border-gray-700">${activity}</h3>
                <div>${timeSlotsHtml}</div>
            `;
            adminScheduleContainer.appendChild(activityCard);
        });
    }

    // ===== MANEJO DE ELIMINACIÓN (SIN CAMBIOS) =====
    
    adminScheduleContainer.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            reservationIdToDelete = deleteButton.dataset.id;
            const userName = deleteButton.dataset.name;
            deleteConfirmText.textContent = `¿Estás seguro de que querés eliminar la reserva de ${userName}? Esta acción no se puede deshacer.`;
            deleteModal.classList.remove('hidden');
        }
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        reservationIdToDelete = null;
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (reservationIdToDelete) {
            try {
                await deleteDoc(doc(db, 'reservations', reservationIdToDelete));
            } catch (error) {
                console.error("Error al eliminar la reserva: ", error);
            } finally {
                deleteModal.classList.add('hidden');
                reservationIdToDelete = null;
            }
        }
    });

    // Carga inicial de las reservas para el día de hoy
    fetchAndRenderReservations();
});


