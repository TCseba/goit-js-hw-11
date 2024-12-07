import Notiflix from 'notiflix';
import { fetchImages } from './fetchImages';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const searchForm = document.querySelector('#search-form');
const gallery = document.querySelector('.gallery');

let currentPage = 1;
let currentQuery = '';
let lightbox;
let observer;

searchForm.addEventListener('submit', onSearch);

async function onSearch(event) {
  event.preventDefault();
  currentQuery = event.target.searchQuery.value.trim();
  if (currentQuery === '') {
    Notiflix.Notify.failure('Please enter a search query.');
    return;
  }

  currentPage = 1;
  gallery.innerHTML = '';

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

    lightbox = new SimpleLightbox('.gallery a'); // Inițializează SimpleLightbox
    observer = new IntersectionObserver(onEntry, {
      rootMargin: '200px',
    });
    observer.observe(document.querySelector('.scroll-sentinel'));
  } catch (error) {
    Notiflix.Loading.remove();
    Notiflix.Notify.failure('Oops! Something went wrong. Please try again later.');
  }
}

async function loadMore() {
  currentPage += 1;
  Notiflix.Loading.standard('Loading...');

  try {
    const data = await fetchImages(currentQuery, currentPage);
    Notiflix.Loading.remove();

    renderGallery(data.hits);

    lightbox.refresh(); // Reîmprospătează SimpleLightbox după adăugarea de noi imagini

    const { height: cardHeight } = document
      .querySelector('.gallery')
      .firstElementChild.getBoundingClientRect();

    window.scrollBy({
      top: cardHeight * 2,
      behavior: 'smooth',
    });

    if (currentPage * 40 >= data.totalHits) {
      Notiflix.Notify.info("We're sorry, but you've reached the end of search results.");
      observer.disconnect();
    } else {
      observer.observe(document.querySelector('.scroll-sentinel')); // Continuăm observarea
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

  // Eliminăm și recreăm sentinelul după fiecare grup de imagini
  if (document.querySelector('.scroll-sentinel')) {
    document.querySelector('.scroll-sentinel').remove();
  }
  const sentinel = document.createElement('div');
  sentinel.classList.add('scroll-sentinel');
  gallery.appendChild(sentinel);
}

function onEntry(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadMore();
    }
  });
}
