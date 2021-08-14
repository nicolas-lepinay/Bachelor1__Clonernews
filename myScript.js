let state = {};

// Indices de la 1ère et de la dernière stories à récupérer :
let start = 0;
let n = 15;
let latestID;
let timer;

let printMoreStories = false;
let pageSelection = "topstories"; // Rubrique dans laquelle récupérer les stories. 
const hackernewsURL = "https://hacker-news.firebaseio.com/v0";
let result = document.getElementById("result"); // Élément du DOM dans lequel les stories seront affichées.


// JE RÉCUPERE LES IDs DE TOUTES LES 'TOP STORIES' :
function fetchTopStoriesID() {

    // La pop-up "Don't miss out" doit être invisibilisée après chaque initialisation :
    clearInterval(timer);
    document.querySelector(".container").style.display = "none";

    if (pageSelection == "newstories") { fetchLatestID(); }

    // Je return un array contenant les IDs de toutes les Top Stories, et je le passe dans la fonction fetchStories :
    return fetch(`${hackernewsURL}/${pageSelection}.json`)
        .then(response => response.json())
        .then(topStoriesID_array => fetchStories(topStoriesID_array)); // .then(topStoriesID => console.log(topStoriesID)); ➤ Array(500) [26263508, 26262465, 26262170, ...]
}

//-----------------------------------------//⭐\\-----------------------------------------\\
// ** VERSION AVEC ASYNC / AWAIT **
//
// async function fetchTopStoriesID() {
//     // Je crée un array contenant les IDs de toutes les Top Stories :
//     const array = await fetch(`${hackernewsURL}/topstories.json`)
//         .then(response => response.json()); // ➤ array(500) [26263508, 26262465, 26262170, ...]
//
//     // Je passe cet array dans la prochaine fonction fetchStories() :
//     return fetchStories(array);
// }
//-----------------------------------------\\⭐//-----------------------------------------//


// JE RÉCUPERE TOUTES LES 'TOP STORIES' (items) QUE J'AJOUTE DANS L'OBJET state :
function fetchStories(array) {

    let topStoriesID = array.slice(start, n + start); // Array des IDs des 15 Top Stories les plus récentes.

    let topStories = topStoriesID.map(id => { // Pour chaque ID de l'array topStoriesID...
        return fetch(`${hackernewsURL}/item/${id}.json`) //...je fetch l'item (la story) correspondant, et je l'ajoute à l'array topStories : topStories devient donc un array de 50 items (50 objets).
            .then(response => response.json())
    });

    return Promise.all(topStories) // Lorsque la promesse contenue dans topStories est réalisée...
        .then(topStories => {
            state.stories = topStories // À l'objet state, j'ajoute l'array topStories, dont la propriété est 'stories' : state = {stories: [item1, item2, ... ] }  
            printStories(topStories)
        });
}

// J'IMPRIME LES TOP STORIES DANS LE DOM :
function printStories(topStories) {

    // Pour chaque story de l'array topStories...
    return topStories.map(story => {

                let userURL = `https://news.ycombinator.com/user?id=${story.by}`

                let comment; // S'il n'y qu'un seul commentaire à afficher, "comment" doit être au singulier :
                story.descendants == 1 ? comment = "comment" : comment = "comments"

                let HTMLtoInsert = `
        <div class="story" id="${story.id}">

            <h3 class="title"> ${story.url ?
                `<a href='${story.url}' target='_blank'> ${story.title} </a>`
                : `<a href="javascript:void(0)" onclick="toggleStoryText('${story.id}')"> ${story.title} </a>` }
            </h3>

            <span class='score'> ${story.score} </span> points by <a href='${userURL}' target='_blank' class='story-by'> ${story.by}</a>

                <div class="toggle-view">
                ${story.kids ?
                `<span onclick="fetchOrToggleComments('${story.kids}', '${story.id}')" class="comments"> ❯ show ${story.descendants} ${comment} </span>`
                : '' }
                </div>

                ${story.text ?
                `<div class="storyText" id="storyText-${story.id}" style="display:block"> <span style="font-size: 300%">“</span> ${story.text} <span style="font-size: 300%">”</span> </div>`
                : '' }

                <div id="comments-${story.id}" style="display:block">
                </div>

        </div>           
        `
        result.insertAdjacentHTML('beforeend', HTMLtoInsert);    // .insertAdjacentHTML(...) et .innerHTML = ... prennent des strings. Par contre, .appendChild() prend un élément HTML en argument, qui doit être créé au préalable avec document.createElement(...).
        printMoreStories = false;
    })
};

// MASQUER/AFFICHER LE TEXTE DES STORIES :
function toggleStoryText(storyID)
{
    let storyText = document.getElementsById(`storyText-${storyID}`);

    if(storyText.style.display == "block") { storyText.style.display = "none" }
    else { storyText.style.display = "block" }
    // Équivalent à : storyText.style.display = (storyText.style.display === 'block') ? 'none' : 'block'
}

// RÉCUPERER (FETCH) LES COMMENTAIRES DES STORIES :
function fetchComments(kids, storyID)
{
    let commentIDs = kids.split(",");

    // Pour chaque ID de l'array commentIDs, je fetch l'item (commentaire) correspondant. Je stocke le résultat (tous les items/commentaires) dans un array allComments.
    let allComments = commentIDs.map(commentID => {
            return fetch(`${hackernewsURL}/item/${commentID}.json`)
                .then(response => response.json());
        });

    return Promise.all(allComments)     // Lorsque la promesse contenue dans allComments a été réalisée...
        .then(comments => {
                state[storyID] = comments;
                printComments(comments, storyID);
            });
}


function fetchOrToggleComments(kids, storyID)
{
    function toggleAllComments(storyID)
    {
        let allComments = document.getElementById(`comments-${storyID}`);

        if(allComments.style.display == "block") { allComments.style.display = "none" }
        else { allComments.style.display = "block" }
    }
    state[storyID] ? toggleAllComments(storyID) : fetchComments(kids, storyID)
}


function toggleComment(commentID)
{
    let comment = document.getElementById(commentID);
    let toggle = document.getElementById(`toggle-${commentID}`);

    if(comment.style.display == "block") { comment.style.display = "none" }
    else { comment.style.display = "block" }
    
    if(toggle.innerHTML == '[ – ]') { toggle.innerHTML = '[ + ]' }
    else { toggle.innerHTML = '[ – ]' }
}

// IMPRIMER LES COMMENTS DANS LE DOM :
function printComments(comments, storyID)
{
    // Pour chaque commentaire de l'array comments :
    return comments.map(comment => {

        let userURL = `https://news.ycombinator.com/user?id=${comment.by}`;
        let HTMLtoInsert = '';

        if(comment.deleted != true && comment.dead != true)
        {
            HTMLtoInsert =
            `
            <div class="comment">
                <span onclick="toggleComment(${comment.id})" href="javascript:void(0)" id="toggle-${comment.id}" class="toggle-comment" >[ – ]</span>

                <a href=${userURL} class="comment-by"> ${comment.by} </a>

                <div id=${comment.id} class="comment-text" style="display:block"> ${comment.text} </div>
            </div>
            `
        }
        if(comment.parent == storyID){
            document.getElementById(`comments-${storyID}`).insertAdjacentHTML("beforeend", HTMLtoInsert);
        }
        else {
            document.getElementById(comment.parent).insertAdjacentHTML("beforeend", HTMLtoInsert)
        }

        if(comment.kids) { return fetchComments(comment.kids.toString(), storyID) };
    });
}


// SÉLECTION DE LA PAGE :
function toggleButton(str) {    
    // str : ID du bouton cliqué ("topstories", "newstories", "jobstories", etc.)

    pageSelection = str;
    start = 0;
    n = 15;
    result.innerHTML = "";
    fetchTopStoriesID();

    let clickedButton = document.getElementById(str);
    let allButtons = document.getElementsByClassName("page-title");

    [...allButtons].forEach(button => button.className = "page-title unselected");  // Tous les boutons prennent la classe "page-title unselected" (et deviennent donc gris).
    clickedButton.className = "page-title"; // Seul le bouton cliqué prend la classe "page-title" (et devient donc orange).
}


// AFFICHE DE NOUVELLES STORIES LORSQUE LE BAS DE LA PAGE A ÉTÉ ATTEINT :
window.onscroll = function(ev) {
    // window.innerHeight ▸ hauteur de l'écran.
    // window.scrollY ▸ coordonnée de la barre de défilement verticale ('0' lorsqu'on est tout en haut).
    // document.body.offsetHeight ▸ hauteur de la page HTML.

    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight && printMoreStories === false) {
      printMoreStories = true;
      start += n;
      fetchTopStoriesID();
    }
  };



// INITIALISATION :
fetchTopStoriesID();


// GESTION DU LIVE DATA :
async function fetchLatestID() {

    latestID = await fetch(`${hackernewsURL}/${pageSelection}.json`)
    .then(response => response.json())
    .then(newStoriesID_array => newStoriesID_array[0]);

    timer = setInterval(checkForUpdate, 5000);
}

async function checkForUpdate() {

    let latestID_updated = await fetch(`${hackernewsURL}/${pageSelection}.json`)
        .then(response => response.json())
        .then(newStoriesID_array => newStoriesID_array[0]);

    if(latestID_updated != latestID)
    {
        document.querySelector(".container").style.display = '';
    }
}