import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==================================================================
//  CONFIGURACIÓN DE FIREBASE 
// ==================================================================
const firebaseConfig = {
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

// Estructura de horarios por actividad
const gymSchedule = {
    'Crossfit': {
        totalSlots: 10,
        schedule: [
            { day: 1, time: '08:00' }, { day: 1, time: '09:00' }, { day: 1, time: '18:00' }, { day: 1, time: '19:00' }, { day: 1, time: '20:00' },
            { day: 2, time: '08:00' }, { day: 2, time: '09:00' }, { day: 2, time: '18:00' }, { day: 2, time: '19:00' }, { day: 2, time: '20:00' },
            { day: 3, time: '08:00' }, { day: 3, time: '09:00' }, { day: 3, time: '18:00' }, { day: 3, time: '19:00' }, { day: 3, time: '20:00' },
            { day: 4, time: '08:00' }, { day: 4, time: '09:00' }, { day: 4, time: '18:00' }, { day: 4, time: '19:00' }, { day: 4, time: '20:00' },
            { day: 5, time: '08:00' }, { day: 5, time: '09:00' }, { day: 5, time: '18:00' }, { day: 5, time: '19:00' }, { day: 5, time: '20:00' },
        ]
    },
    'Funcional': {
        totalSlots: 10,
        schedule: [
            { day: 1, time: '10:30' }, { day: 1, time: '11:30' }, { day: 1, time: '15:00' }, { day: 1, time: '16:00' },
            { day: 2, time: '10:30' }, { day: 2, time: '11:30' }, { day: 2, time: '15:00' }, { day: 2, time: '16:00' },
            { day: 4, time: '10:30' }, { day: 4, time: '11:30' }, { day: 4, time: '15:00' }, { day: 4, time: '16:00' },
            { day: 5, time: '10:30' }, { day: 5, time: '11:30' }, { day: 5, time: '15:00' }, { day: 5, time: '16:00' },
        ]
    },
    'Musculación': {
        totalSlots: 10,
        schedule: [
        ]
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Selectores del DOM
    const activitySelector = document.getElementById('activity-selector');
    const bookingFlow = document.getElementById('booking-flow');
    const daySelector = document.getElementById('day-selector');
    const scheduleContainer = document.getElementById('schedule-container');
    const selectedDayText = document.getElementById('selected-day-text');
    const userNameInput = document.getElementById('user-name');
    const nameError = document.getElementById('name-error');
    const confirmationModal = document.getElementById('confirmation-modal');
    const errorModal = document.getElementById('error-modal');

    let selectedActivity = null;
    let selectedDate = null;

    // 1. Renderiza las tarjetas de actividades
    function renderActivities() {
        activitySelector.innerHTML = '';
        Object.keys(gymSchedule).forEach(activity => {
            const card = document.createElement('button');
            card.className = 'p-6 bg-gray-800 rounded-lg text-left w-full interactive-element transition-all duration-300 hover:bg-gray-700';
            card.innerHTML = `<h3 class="text-xl font-bold text-cyan-400">${activity}</h3><p class="text-gray-400 mt-1">Ver horarios disponibles</p>`;
            card.addEventListener('click', () => handleActivitySelection(activity, card));
            activitySelector.appendChild(card);
        });
    }

    // 2. Maneja la selección de una actividad
    function handleActivitySelection(activity, selectedCard) {
        selectedActivity = activity;
        document.querySelectorAll('#activity-selector button').forEach(btn => {
            btn.classList.remove('border-2', 'border-cyan-500');
        });
        selectedCard.classList.add('border-2', 'border-cyan-500');
        bookingFlow.classList.remove('hidden');
        setTimeout(() => bookingFlow.classList.remove('opacity-0'), 10);
        renderDaysForActivity(activity);
        scheduleContainer.innerHTML = '<p class="text-gray-500 text-center">Seleccioná un día para ver los horarios.</p>';
        selectedDayText.textContent = '';
    }
    
    // 3. Renderiza los días disponibles para la actividad
    function renderDaysForActivity(activity) {
        daySelector.innerHTML = '';
        const today = new Date();
        const availableDaysInSchedule = gymSchedule[activity].schedule.map(slot => slot.day);

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            const dayOfWeek = date.getDay();
            
            const isAvailable = availableDaysInSchedule.includes(dayOfWeek);
            const dayButton = document.createElement('button');
            dayButton.className = `p-3 rounded-lg font-semibold transition-colors duration-300 ${isAvailable ? 'bg-gray-700 hover:bg-cyan-600' : 'day-disabled'}`;
            dayButton.textContent = date.toLocaleDateString('es-ES', { day: 'numeric', weekday: 'short' }).replace('.', '');
            
            if (isAvailable) {
                dayButton.onclick = () => {
                    document.querySelectorAll('#day-selector button').forEach(btn => btn.classList.remove('bg-cyan-500'));
                    dayButton.classList.add('bg-cyan-500');
                    selectedDate = date.toISOString().split('T')[0];
                    selectedDayText.textContent = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
                    renderSchedule(activity, date); // Llama a renderSchedule
                };
            } else {
                dayButton.disabled = true;
            }
            daySelector.appendChild(dayButton);
        }
    }

    // 4. Renderiza los horarios para la actividad y día seleccionados (FUNCIÓN CLAVE)
    async function renderSchedule(activity, date) {
        scheduleContainer.innerHTML = '<div class="text-center py-4"><div class="loader"></div></div>';
        const dateString = date.toISOString().split('T')[0];
        const reservationsRef = collection(db, 'reservations');
        const q = query(reservationsRef, where("date", "==", dateString), where("activity", "==", activity));
        
        try {
            const querySnapshot = await getDocs(q);
            const bookings = [];
            querySnapshot.forEach(doc => bookings.push(doc.data()));

            scheduleContainer.innerHTML = '';
            const slotsForDay = gymSchedule[activity].schedule.filter(slot => slot.day === date.getDay());
            
            if (slotsForDay.length === 0) {
                scheduleContainer.innerHTML = '<p class="text-gray-500 text-center">No hay horarios disponibles para este día.</p>';
                return;
            }

            slotsForDay.sort((a,b) => a.time.localeCompare(b.time)).forEach(slot => {
                const totalSlots = gymSchedule[activity].totalSlots;
                const bookingsForSlot = bookings.filter(b => b.time === slot.time).length;
                const available = totalSlots - bookingsForSlot;
                const isFull = available <= 0;

                const card = document.createElement('div');
                card.className = `bg-gray-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in ${isFull ? 'opacity-60' : ''}`;
                
                const buttonHtml = `<button class="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold py-2 px-6 rounded-lg transition duration-300" ${isFull ? 'disabled' : ''}>${isFull ? 'Completo' : 'Reservar'}</button>`;

                card.innerHTML = `
                    <div class="flex-grow text-center sm:text-left">
                        <p class="text-lg font-semibold">${slot.time}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-sm font-medium">${available}/${totalSlots}</p>
                        <p class="text-xs text-gray-500">cupos</p>
                    </div>
                    <div class="w-full sm:w-auto">${buttonHtml}</div>
                `;
                
                if (!isFull) {
                    card.querySelector('button').addEventListener('click', () => handleReservation(slot.time));
                }
                
                scheduleContainer.appendChild(card);
            });
        } catch (error) {
            console.error("Error al obtener horarios: ", error);
            scheduleContainer.innerHTML = '<p class="text-red-400 text-center">No se pudieron cargar los horarios. Verificá tu conexión a Firebase.</p>';
        }
    }

    // 5. Maneja el proceso de guardar la reserva
    async function handleReservation(time) {
        const userName = userNameInput.value.trim();
        if (!userName) {
            nameError.classList.remove('hidden');
            userNameInput.focus();
            return;
        }
        nameError.classList.add('hidden');

        try {
            const reservationsRef = collection(db, 'reservations');
            // Verifica si el usuario ya tiene una reserva para ese día (en cualquier actividad)
            const q = query(reservationsRef, where("date", "==", selectedDate), where("name", "==", userName));
            const existingBookingSnapshot = await getDocs(q);
            
            if (!existingBookingSnapshot.empty) {
                showErrorModal();
                return;
            }

            const reservation = {
                name: userName,
                date: selectedDate,
                time: time,
                activity: selectedActivity
            };
            
            await addDoc(reservationsRef, reservation);
            showConfirmationModal(reservation);

        } catch (error) {
            console.error("Error al guardar reserva: ", error);
            alert("Hubo un error al intentar guardar tu reserva. Por favor, intentá de nuevo.");
        }
    }
    
    // Funciones para mostrar los modales (sin cambios)
    function showConfirmationModal(reservation) {
        confirmationModal.innerHTML = `
            <div class="bg-gray-800 rounded-xl p-8 text-center max-w-sm mx-auto animate-fade-in">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-500 mb-4">
                    <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 class="text-2xl font-bold mb-2">¡Turno Confirmado!</h3>
                <p class="text-gray-300 mb-6">Reservaste para ${reservation.activity} el ${new Date(reservation.date + 'T00:00:00').toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric'})} a las ${reservation.time}hs.</p>
                <button id="close-confirm-modal-btn" class="bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold py-2 px-8 rounded-lg transition duration-300">Entendido</button>
            </div>
        `;
        confirmationModal.classList.remove('invisible', 'opacity-0');
        confirmationModal.querySelector('#close-confirm-modal-btn').addEventListener('click', () => {
            confirmationModal.classList.add('invisible', 'opacity-0');
        });
    }

    function showErrorModal() {
        errorModal.innerHTML = `
            <div class="bg-gray-800 rounded-xl p-8 text-center max-w-sm mx-auto animate-fade-in">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500 mb-4">
                    <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 class="text-2xl font-bold mb-2">Reserva Duplicada</h3>
                <p class="text-gray-300 mb-6">Ya tenés una reserva para este día. Solo se permite un turno por día por persona.</p>
                <button id="close-error-modal-btn" class="bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-8 rounded-lg transition duration-300">Entendido</button>
            </div>
        `;
        errorModal.classList.remove('invisible', 'opacity-0');
        errorModal.querySelector('#close-error-modal-btn').addEventListener('click', () => {
            errorModal.classList.add('invisible', 'opacity-0');
        });
    }

    // Inicia la aplicación
    renderActivities();
});

