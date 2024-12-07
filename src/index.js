import Notiflix from 'notiflix';
import { fetchImages } from './fetchImages';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const searchForm = document.querySelector('#search-form');
const gallery = document.querySelector('.gallery');
const loadMoreBtn = document.querySelector('.load-more');

let currentPage = 1;
let currentQuery = '';
let lightbox;

searchForm.addEventListener('submit', onSearch);
loadMoreBtn.addEventListener('click', onLoadMore);

async function onSearch(event) {
  event.preventDefault();
  currentQuery = event.target.searchQuery.value.trim();
  if (currentQuery === '') {
    Notiflix.Notify.failure('Please enter a search query.');
    return;
  }

  currentPage = 1;
  gallery.innerHTML = '';
  loadMoreBtn.hidden = true;

  Notiflix.Loading.standard('Loading...');

  try {
    const data = await fetchImages(currentQuery, currentPage);
    Notiflix.Loading.remove();

    if (data.hits.length === 0) {
      Notiflix.Notify.failure('Sorry, there are no images matching your search query. Please try again.');
      return;
    }

    renderGallery(data.hits);
    Notiflix.Notify.success(`Hooray! We found ${data.totalHits} images.`);
    if (data.totalHits > 40) {
      loadMoreBtn.hidden = false;
    }

    lightbox = new SimpleLightbox('.gallery a'); // Inițializează SimpleLightbox
  } catch (error) {
    Notiflix.Loading.remove();
    Notiflix.Notify.failure('Oops! Something went wrong. Please try again later.');
  }
}

async function onLoadMore() {
  currentPage += 1;
  Notiflix.Loading.standard('Loading...');

  try {
    const data = await fetchImages(currentQuery, currentPage);
    Notiflix.Loading.remove();

    renderGallery(data.hits);

    lightbox.refresh(); // Reîmprospătează SimpleLightbox după adăugarea de noi imagini

    if (currentPage * 40 >= data.totalHits) {
      Notiflix.Notify.info("We're sorry, but you've reached the end of search results.");
      loadMoreBtn.hidden = true;
    }
  } catch (error) {
    Notiflix.Loading.remove();
    Notiflix.Notify.failure('Oops! Something went wrong. Please try again later.');
  }
}

function renderGallery(images) {
  const markup = images.map(image => `
    <div class="photo-card">
      <a href="${image.largeImageURL}" class="gallery__item">
        <img src="${image.webformatURL}" alt="${image.tags}" loading="lazy" />
      </a>
      <div class="info">
        <p class="info-item">
          <b>Likes</b> ${image.likes}
        </p>
        <p class="info-item">
          <b>Views</b> ${image.views}
        </p>
        <p class="info-item">
          <b>Comments</b> ${image.comments}
        </p>
        <p class="info-item">
          <b>Downloads</b> ${image.downloads}
        </p>
      </div>
    </div>
  `).join('');
  gallery.insertAdjacentHTML('beforeend', markup);
}
