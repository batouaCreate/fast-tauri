export const API_CONFIG = {
  baseUrl: 'https://guichet.createsarl.com/api',
  endpoints: {
    login: '/signin',
    loadAllDepartures: '/loadalldep',
    loadGareDest: '/loadgaredest',
    addDepart: '/adddepart',
    colisByUser: '/colisbyuser',
    createColis: '/createcolis_v2',
    bagageByUser: '/bagagebyuser',
    createBagage: '/createbagage',
    ticketByUser: '/ticketbyuser',
    loadDest: '/loaddest',
    addDestination: '/adddestination',
    displaySiege: '/displaysiege',
    sellBillet: '/sellbillet',
    dashboard: '/dashboard',
    bordBillet: '/bordbillet',
    bordColis: '/bordcolis',
    bordBagage: '/bordbagage',
  },
  timeout: 30000, // 30 seconds
};