'use strict';



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');



///////////////////////////////////////////////
// ---------Let's Code---------

let map, mapEvent;

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10)
    clicks = 0;

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _setDiscription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'Auguest', 'September', 'October', 'November', 'December'];

        this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }

    click() {
        this.clicks++;
    }
}

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration)
        this.cadence = cadence;
        this.calcPace();
        this._setDiscription()

    }

    calcPace() {
        //     min/Km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}


class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration)
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDiscription()

    }

    calcSpeed() {
        //   Km/h
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}


/////////////////////////////////////////////
/////////////////////////////////////////////
// ------Application------

class App {
    #map;
    #mapEvent;
    #workouts = []
    #mapZoom = 13;

    constructor() {
        // User position
        this._getPosition()

        // Get data from local storage
        this._getLocalStorage()

        // Attach Event handlers
        form.addEventListener('submit', this._newWorkouts.bind(this));

        inputType.addEventListener('change', this._toggleElevationField.bind(this))

        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this))
    }


    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert('Could not find your location')
            });
    }

    _loadMap(position) {

        const { latitude } = position.coords
        const { longitude } = position.coords
        // console.log(`https://www.google.com/maps/@${latitude}.${longitude}`);

        const coords = [latitude, longitude]

        this.#map = L.map('map').setView(coords, this.#mapZoom)
        // console.log(map);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this))

        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work)
        });
    }


    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden')
        inputDistance.focus()
    }


    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    }


    _newWorkouts(e) {

        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp))

        const allPositive = (...inputs) => inputs.every(inp => inp > 0)

        e.preventDefault()

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng
        let workout;


        // If workout running, create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            // Check if data is valid
            if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence))
                return alert('Inputs have to be positive Numbers')

            workout = new Running([lat, lng], distance, duration, cadence)
        }

        // If workout cycling, create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            // Check if data is valid
            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration))
                return alert('Inputs have to be positive Numbers')

            workout = new Cycling([lat, lng], distance, duration, elevation)
        }

        // Add new object to workout array
        this.#workouts.push(workout)
        console.log(workout);


        // Render workout on map as marker
        this._renderWorkoutMarker(workout)


        // Render workout on list
        this._renderWorkout(workout)

        // Hide form and Clearing Inputs
        this._hideForm()

        // Set localStorage to all workouts 
        this._setLocalStorage()
    }

    _renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(`${workout.type === 'running' ? '🏃🏻‍♂️' : '🚴🏻‍♂️'} ${workout.discription}`)
            .openPopup();
    }


    _renderWorkout(workout) {
        let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.discription}</h2>
            <div class="workout__details">
                <span class="workout__icon">${workout.type === 'running' ? '🏃🏻‍♂️' : '🚴🏻‍♂️'}</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
        `;

        if (workout.type === 'running')
            html += `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
            </li>
            `;


        if (workout.type === 'cycling')
            html += `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
            </div>
            </li>
            `

        form.insertAdjacentHTML('afterend', html)

    }


    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        form.classList.add('hidden')
    }


    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout')

        if (!workoutEl) return;

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id)
        console.log(workout);

        this.#map.setView(workout.coords, this.#mapZoom, {
            animate: true,
            pan: {
                duration: 1,
            },
        });

        // Use public interface
        // workout.click()
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts))
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'))
        console.log(data);

        if (!data) return;

        this.#workouts = data;

        this.#workouts.forEach(work => {
            this._renderWorkout(work)
        });

    }

    reset() {
        localStorage.removeItem('workouts')
        location.reload()
    }
}

const app = new App()



