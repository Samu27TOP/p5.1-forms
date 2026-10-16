// In-memory storage
let pets = [];
let editingId = null;
let nextId = 1;

const form = document.getElementById('pet-form');
const petList = document.getElementById('pet-list');
const emptyMsg = document.getElementById('empty-msg');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');

const fields = {
  name: document.getElementById('name'),
  description: document.getElementById('description'),
  image: document.getElementById('image'),
  birthdate: document.getElementById('birthdate'),
  price: document.getElementById('price'),
  code: document.getElementById('code'),
  sold: document.getElementById('sold')
};

// Validation patterns
const CODE_REGEX = /^[A-Za-z]{3}[0-9]{3}$/;

function setError(field, message) {
  const errorEl = document.getElementById(field + '-error');
  if (errorEl) errorEl.textContent = message;
  fields[field].classList.toggle('invalid', Boolean(message));
}

function clearErrors() {
  ['name', 'image', 'birthdate', 'price', 'code'].forEach(f => setError(f, ''));
}

function isPastOrToday(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return !isNaN(date) && date <= today;
}

function validate() {
  clearErrors();
  let valid = true;
  const name = fields.name.value.trim();
  const image = fields.image.value.trim();
  const birthdate = fields.birthdate.value;
  const price = fields.price.value;
  const code = fields.code.value.trim().toUpperCase();

  if (!name) { setError('name', 'Name is required.'); valid = false; }

  if (!image) { setError('image', 'Image URL is required.'); valid = false; }
  else if (!isValidImageUrl(image)) {
    setError('image', 'Enter a valid image URL.'); valid = false;
  }

  if (!birthdate) { setError('birthdate', 'Birthdate is required.'); valid = false; }
  else if (!isPastOrToday(birthdate)) {
    setError('birthdate', 'Birthdate cannot be in the future.'); valid = false;
  }

  if (price === '') { setError('price', 'Price is required.'); valid = false; }
  else if (isNaN(Number(price)) || Number(price) <= 0) {
    setError('price', 'Price must be greater than zero.'); valid = false;
  }

  if (!code) { setError('code', 'Pet code is required.'); valid = false; }
  else if (!CODE_REGEX.test(code)) {
    setError('code', 'Use 3 letters followed by 3 numbers (e.g. CAT123).'); valid = false;
  } else if (pets.some(p => p.code === code && p.id !== editingId)) {
    setError('code', 'This pet code already exists.'); valid = false;
  }

  return valid;
}

// CRUD
function addPet(data) {
  pets.push({ id: nextId++, ...data });
}

function updatePet(id, data) {
  const index = pets.findIndex(p => p.id === id);
  if (index !== -1) pets[index] = { id, ...data };
}

function deletePet(id) {
  pets = pets.filter(p => p.id !== id);
  if (editingId === id) resetForm();
}

function toggleSold(id) {
  const pet = pets.find(p => p.id === id);
  if (pet) pet.sold = !pet.sold;
}

function isValidImageUrl(value) {
  // Embedded images
  if (/^data:image\/(png|jpe?g|gif);base64,/i.test(value)) return true;

  // Local/relative paths or absolute URLs, extension before ? or #
  const extRegex = /\.(jpg|jpeg|png|gif)(?:[?#].*)?$/i;
  if (!extRegex.test(value)) return false;

  // Absolute URLs must be http(s); relative paths are accepted
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    try {
      const url = new URL(value);
      return ['http:', 'https:', 'file:'].includes(url.protocol);
    } catch {
      return false;
    }
  }
  return true;
}

// Rendering
function renderPets() {
  petList.innerHTML = '';
  emptyMsg.hidden = pets.length > 0;

  pets.forEach(pet => {
    const card = document.createElement('article');
    card.className = 'pet' + (pet.sold ? ' sold' : '');

    const badge = document.createElement('span');
    badge.className = 'badge' + (pet.sold ? '' : ' available');
    badge.textContent = pet.sold ? 'SOLD' : 'Available';

    const img = document.createElement('img');
    img.src = pet.image;
    img.alt = pet.name;
    img.addEventListener('error', () => { img.alt = 'Image not available'; });

    const body = document.createElement('div');
    body.className = 'pet-body';
    const title = document.createElement('h3');
    title.textContent = pet.name;
    body.appendChild(title);
    [
      ['Description', pet.description || '-'],
      ['Birthdate', pet.birthdate],
      ['Price', '$' + Number(pet.price).toFixed(2)],
      ['Code', pet.code]
    ].forEach(([label, value]) => {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = label + ': ';
      p.appendChild(strong);
      p.appendChild(document.createTextNode(value));
      body.appendChild(p);
    });

    const actions = document.createElement('div');
    actions.className = 'pet-actions';
    actions.appendChild(makeButton('Edit', '', () => startEdit(pet.id)));
    actions.appendChild(makeButton('Delete', 'danger', () => {
      if (confirm('Delete ' + pet.name + '?')) { deletePet(pet.id); renderPets(); }
    }));
    actions.appendChild(makeButton(pet.sold ? 'Mark Available' : 'Mark Sold', 'toggle', () => {
      toggleSold(pet.id); renderPets();
    }));

    card.append(badge, img, body, actions);
    petList.appendChild(card);
  });
}

function makeButton(text, className, handler) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = text;
  if (className) btn.className = className;
  btn.addEventListener('click', handler);
  return btn;
}

// Form handling
function startEdit(id) {
  const pet = pets.find(p => p.id === id);
  if (!pet) return;
  editingId = id;
  fields.name.value = pet.name;
  fields.description.value = pet.description;
  fields.image.value = pet.image;
  fields.birthdate.value = pet.birthdate;
  fields.price.value = pet.price;
  fields.code.value = pet.code;
  fields.sold.checked = pet.sold;
  formTitle.textContent = 'Edit Pet';
  submitBtn.textContent = 'Save Changes';
  cancelBtn.hidden = false;
  clearErrors();
  form.scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
  form.reset();
  editingId = null;
  formTitle.textContent = 'Add Pet';
  submitBtn.textContent = 'Add Pet';
  cancelBtn.hidden = true;
  clearErrors();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!validate()) return;

  const data = {
    name: fields.name.value.trim(),
    description: fields.description.value.trim(),
    image: fields.image.value.trim(),
    birthdate: fields.birthdate.value,
    price: Number(fields.price.value),
    code: fields.code.value.trim().toUpperCase(),
    sold: fields.sold.checked
  };

  if (editingId === null) addPet(data);
  else updatePet(editingId, data);

  resetForm();
  renderPets();
});

cancelBtn.addEventListener('click', resetForm);

renderPets();
