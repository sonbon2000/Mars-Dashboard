/** add our markup to the page. */
const root = document.getElementById("root");

/**
 * High order function update
 */
const updateStore = async (cRoot, cStore, newState = {}, callback = null) => {
    const newStore = cStore.mergeDeep(newState);
    await render(cRoot, newStore);
    if (callback !== null) return callback(newStore);
};

const render = async (cRoot, state) => {
    cRoot.innerHTML = App(cRoot, state);
};

const App = (cRoot, state) => {
    const user = state.get("user");
    const rovers = state.get("rovers");
    const selectedRoverGal = state.get("selectedRoverGal");
    const roversHtml =
        rovers && rovers.map((rover) => GenerateCard(state, rover)).join("");
    const gal =
        selectedRoverGal &&
        selectedRoverGal.get("photos") &&
        selectedRoverGal
            .get("photos")
            .map((photo) => PhotoModal(photo))
            .join("");

    return `
        <header class="container-fluid">
            Mars Dashboard
        </header>
        <main class="container-fluid">
            <div class="jumbotron">
                ${Greeting(user.get("name"))}
                <p class="lead">Mars rover dashboard that consumes the NASA API</p>
            </div>

            <div class="row">
                ${rovers ? roversHtml : Spinner()}
            </div>
            <div class="row row-cols-1 row-cols-md-3">
                ${selectedRoverGal ? gal : ""}
            </div>
        </main>
        <footer></footer>
    `;
};

// listening for load event because page should load before any JS is called
window.addEventListener("load", () => {
    const store = Immutable.Map({
        user: Immutable.Map({ name: "Student" }),
        selectedRover: false,
        selectedRoverGal: false,
    });
    render(root, store);
    getListOfRovers((data) => {
        const rovers = Immutable.Map({
            rovers: Immutable.fromJS(data.rovers),
        });
        updateStore(root, store, rovers);
    });
});

/**
 * Pure function to generate greetings HTML
 * @returns {string} string representing greetings HTML
 */
const Greeting = (name) => {
    if (name) {
        return `<h1 class="display-4">Welcome, ${name}!</h1>`;
    }
    return '<h1 class="display-4">Hello!</h1>';
};

/**
 * Pure function to generate Spinner HTML
 * @returns {string} string representing Spinner HTML
 */
const Spinner = () => {
    return `
        <div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status">
            <span class="sr-only">Loading...</span>
        </div>
    `;
};

/**
 * Pure function to generate PhotoModal HTML
 * @returns {string} string representing PhotoModal HTML
 */
const PhotoModal = (photo) => {
    const url = photo.get("img_src");
    const alt = photo.get("camera").get("full_name");
    const fullCamName = photo.get("camera").get("full_name");
    const tDate = photo.get("earth_date");
    const roverName = photo.get("rover").get("name");
    const lDate = photo.get("rover").get("landing_date");
    const pLDate = photo.get("rover").get("launch_date");
    const title = `${roverName} - ${fullCamName}`;
    const status = photo.get("rover").get("status");

    const description = `This is a photo from ${fullCamName} for ${roverName}.<br /><br />
   ${roverName} has a${
        status === "active" ? "n" : ""
    } ${status} status.<br /><br />
   ${roverName} landed on Mars in ${lDate}<br /><br />
   This project were launched in ${pLDate}<br /><br />
   This picture were took on ${tDate}
  `;
    return `
    <div class="col mb-4">
        <div class="card h-100">
            <img src="${url}" class="card-img-top" alt="${alt}">
            <div class="card-body">
                <h5 class="card-title">${title}</h5>
                <p class="card-text">${description}</p>
            </div>
        </div>
    </div>
    `;
};

/**
 * Pure function to generate GenerateCard HTML
 * @returns {string} string representing GenerateCard HTML
 */
const GenerateCard = (store, rover) => {
    return `
        <div class="col-sm-6 mb-2">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${rover.get("name")}</h5>
                    <p class="card-text">This rover launched in ${rover.get(
                        "launch_date"
                    )}, land in Mars in ${rover.get(
        "landing_date"
    )} and is now ${rover.get("status")}</p>
                    <button  class="btn btn-primary" onclick="displayRover(${toStrArgs(
                        store
                    )}, ${toStrArgs(rover)})">
                        ${
                            store.get("selectedRover") &&
                            store.get("selectedRover").get("loading") &&
                            store.get("selectedRover").get("name") ===
                                rover.get("name")
                                ? `<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
                                Loading...`
                                : "See Latest Image"
                        }
                    </button>
                </div>
            </div>
        </div>
    `;
};

/**
 * Pure function to stringify an object
 * @returns {string} string representing stringified object
 */
const toStrArgs = (args) => {
    return JSON.stringify(args).replace(/"/g, "'");
};

// eslint-disable-next-line no-unused-vars
const displayRover = (store, data) => {
    const selectedRover = Immutable.Map({
        selectedRoverGal: false,
        selectedRover: Immutable.fromJS({ ...data, loading: true }),
    });

    updateStore(root, Immutable.fromJS(store), selectedRover, processRover);
};

const processRover = (state) => {
    const currentRover = state.get("selectedRover");
    getRoverData(
        currentRover.get("name"),
        currentRover.get("max_date"),
        (data) => {
            const cSelectedRover = Immutable.Map({
                selectedRoverGal: Immutable.fromJS({ ...data }),
                selectedRover: Immutable.fromJS({ loading: false }),
            });
            updateStore(root, state, cSelectedRover);
        }
    );
};

/**
 * High order function to get list of rovers
 */
const getListOfRovers = (callback) => {
    fetch("http://localhost:3000/rovers")
        .then((res) => res.json())
        .then((json) => callback(json));
};

/**
 * High order function to get rover photos
 */
const getRoverData = (roverName, maxDate, callback) => {
    fetch(`http://localhost:3000/rovers/${roverName}?max_date=${maxDate}`)
        .then((res) => res.json())
        .then((json) => callback(json));
};
