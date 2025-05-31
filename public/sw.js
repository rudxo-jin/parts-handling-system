// Service Worker for Parts Handling System
const CACHE_NAME = 'parts-handling-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  // Firebase SDK 캐시
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js',
];

// 오프라인 페이지
const OFFLINE_URL = '/offline.html';

// 설치 이벤트 - 필수 파일들을 캐시
self.addEventListener('install', event => {
  console.log('[SW] 설치 중...', event);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 캐시 열기');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] 필수 파일 캐시 완료');
        // 즉시 활성화
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] 캐시 실패:', error);
      })
  );
});

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener('activate', event => {
  console.log('[SW] 활성화 중...', event);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] 활성화 완료');
      // 모든 클라이언트 제어
      return self.clients.claim();
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Firebase 호스팅이나 로컬 요청만 처리
  if (url.origin !== location.origin && !url.hostname.includes('firebase')) {
    return;
  }

  // GET 요청만 처리
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(response => {
        // 캐시에 있으면 반환
        if (response) {
          console.log('[SW] 캐시에서 반환:', request.url);
          return response;
        }

        // 네트워크에서 가져오기
        return fetch(request).then(response => {
          // 유효한 응답인지 확인
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 응답을 복사해서 캐시에 저장
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              // HTML, CSS, JS, 이미지만 캐시
              if (request.url.match(/\.(html|css|js|png|jpg|jpeg|gif|svg|ico)$/)) {
                console.log('[SW] 새 파일 캐시:', request.url);
                cache.put(request, responseToCache);
              }
            });

          return response;
        });
      })
      .catch(() => {
        // 네트워크 오류 시 오프라인 페이지 반환
        if (request.destination === 'document') {
          return caches.match(OFFLINE_URL);
        }
        
        // API 요청 실패 시 JSON 오류 응답
        if (request.url.includes('/api/')) {
          return new Response(
            JSON.stringify({
              error: '오프라인 상태입니다. 네트워크를 확인해주세요.',
              offline: true
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'application/json'
              })
            }
          );
        }
      })
  );
});

// 백그라운드 동기화
self.addEventListener('sync', event => {
  console.log('[SW] 백그라운드 동기화:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 오프라인 중 저장된 데이터 동기화
      syncOfflineData()
    );
  }
});

// 푸시 알림 수신
self.addEventListener('push', event => {
  console.log('[SW] 푸시 메시지 수신:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || '새로운 알림이 있습니다.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: '열기',
          icon: '/favicon.ico'
        },
        {
          action: 'close',
          title: '닫기'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || '부품 관리 시스템',
        options
      )
    );
  }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
  console.log('[SW] 알림 클릭:', event);
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// 오프라인 데이터 동기화 함수
async function syncOfflineData() {
  try {
    // IndexedDB에서 오프라인 중 저장된 데이터 가져오기
    // Firebase와 동기화
    console.log('[SW] 오프라인 데이터 동기화 시작');
    
    // 실제 구현은 애플리케이션 로직에 따라 달라짐
    // 여기서는 기본 구조만 제공
    
    console.log('[SW] 오프라인 데이터 동기화 완료');
  } catch (error) {
    console.error('[SW] 동기화 오류:', error);
  }
}

// 주기적 백그라운드 동기화
self.addEventListener('periodicsync', event => {
  console.log('[SW] 주기적 동기화:', event.tag);
  
  if (event.tag === 'content-sync') {
    event.waitUntil(
      syncOfflineData()
    );
  }
});

// 메시지 이벤트 (앱과의 통신)
self.addEventListener('message', event => {
  console.log('[SW] 메시지 수신:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

console.log('[SW] Service Worker 로드 완료'); 