
let lists = JSON.parse(localStorage.getItem('lists')) || [];
let currentDialogType = null;
let currentListId = null;

function saveToStorage() {
    localStorage.setItem('lists', JSON.stringify(lists));
}

function openListDialog() {
    currentDialogType = 'list';

    document.getElementById('dialogList').style.display = 'block';
    document.getElementById('dialogCard').style.display = 'none';
    document.getElementById('dialogTitle').value = '';
    document.getElementById('dialogDesc').style.display = 'none';
    document.getElementById('dialogDescPlac').style.display = 'none';
    document.getElementById('dialogOverlay').style.display = 'flex';
}

function openCardDialog(listId) {
    currentDialogType = 'card';
    currentListId = listId;
    document.getElementById('dialogList').style.display = 'none';
    document.getElementById('dialogCard').style.display = 'block';
    document.getElementById('dialogTitle').value = '';
    document.getElementById('dialogDesc').value = '';
    document.getElementById('dialogDescPlac').style.display = 'block';
    document.getElementById('dialogDesc').style.display = 'block';
    document.getElementById('dialogOverlay').style.display = 'flex';
}

function closeDialog() {
    document.getElementById('dialogOverlay').style.display = 'none';
}

function submitDialog() {
    const title = document.getElementById('dialogTitle').value.trim();
    const desc = document.getElementById('dialogDesc').value.trim();
    if (!title) return alert('Title is required');

    if (currentDialogType === 'list') {
        if (lists.some(l => l.title === title)) return alert('List title must be unique');
        lists.push({ id: Date.now(), title, cards: [], created: Date.now() });
    } else {
        const list = lists.find(l => l.id === currentListId);
        list.cards.unshift({ id: Date.now(), title, desc, favorite: false, created: Date.now() });
    }

    saveToStorage();
    closeDialog();
    renderLists();
}

function renderLists() {
    const wrapper = document.getElementById('listsWrapper');
    const noList = document.getElementById('noList');
    const search = document.getElementById('searchInput').value.toLowerCase();

    wrapper.innerHTML = '';
    if (lists.length === 0) {
        noList.style.display = 'block';
        return;
    } else {
        noList.style.display = 'none';
    }

    lists.sort((a, b) => a.created - b.created);
    for (const list of lists) {
        const div = document.createElement('div');
        div.className = 'list';
        div.innerHTML = `
          <div class="list-header">
            <h4>${list.title}</h4>
            <button onclick="deleteList(${list.id})"><img class="icon-delete" src="./assets/delete.png" alt="delete"></button>
          </div>
          <div id="cards-${list.id}">
            ${list.cards.length === 0 ? '<div class="card-no-data">No cards available</div>' : ''}
          </div>
          <button class="add-cart-button margin-top-auto" onclick="openCardDialog(${list.id})"><span style="font-size:18px;">+</span> Add Card</button>
        `;
        wrapper.appendChild(div);

        const cardsDiv = div.querySelector(`#cards-${list.id}`);
        const filteredCards = list.cards.filter(c => c.title.toLowerCase().includes(search) || c.desc.toLowerCase().includes(search));

        for (const card of filteredCards) {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.draggable = true;
            cardEl.dataset.cardId = card.id;
            cardEl.dataset.listId = list.id;
            cardEl.ondragstart = onDragStart;
            cardEl.ondragover = e => e.preventDefault();
            cardEl.ondrop = onDrop;

            cardEl.innerHTML = `
           <div>
                <strong>${card.title}</strong><br>
                <small>${card.desc}</small>
            </div>
            <div>
                <span class="favorite ${card.favorite ? 'marked' : ''}" onclick="toggleFavorite(${list.id}, ${card.id})">★</span>
                <img class="icon-delete" src="./assets/delete.png" alt="delete" onclick="deleteCard(${list.id}, ${card.id})">
            </div>
          `;
            cardsDiv.appendChild(cardEl);
        }
    }
}

function deleteList(id) {
    if (confirm('Delete this list and all its cards?')) {
        lists = lists.filter(l => l.id !== id);
        saveToStorage();
        renderLists();
    }
}

function deleteCard(listId, cardId) {
    const list = lists.find(l => l.id === listId);
    list.cards = list.cards.filter(c => c.id !== cardId);
    saveToStorage();
    renderLists();
}

function toggleFavorite(listId, cardId) {
    const list = lists.find(l => l.id === listId);
    const card = list.cards.find(c => c.id === cardId);
    card.favorite = !card.favorite;
    saveToStorage();
    renderLists();
}

function onDragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: e.target.dataset.cardId, listId: e.target.dataset.listId }));
}

function onDrop(e) {
    const target = e.target.closest('.card');
    const destListId = +target.dataset.listId;
    const destCardId = +target.dataset.cardId;
    const { cardId, listId } = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (+listId === destListId && +cardId === destCardId) return;

    const fromList = lists.find(l => l.id == listId);
    const cardIndex = fromList.cards.findIndex(c => c.id == cardId);
    const card = fromList.cards.splice(cardIndex, 1)[0];

    const toList = lists.find(l => l.id == destListId);
    const destIndex = toList.cards.findIndex(c => c.id == destCardId);
    toList.cards.splice(destIndex, 0, card);

    saveToStorage();
    renderLists();
}

renderLists();
