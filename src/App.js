import React, { useState, useEffect, useRef } from 'react';

// ── LIGHT WARM PALETTE ───────────────────────────────────────────────────────
const BASE_C = {
  bg:       '#e8e0d0',
  panel:    'rgba(255,255,255,0.80)',
  panelHov: 'rgba(255,255,255,0.97)',
  border:   'rgba(150,120,80,0.18)',
  borderM:  'rgba(150,120,80,0.35)',
  gold:     '#b87020',
  goldDim:  'rgba(184,112,32,0.12)',
  goldLine: 'rgba(184,112,32,0.45)',
  text:     '#1e1608',
  sub:      '#6b5d4f',
  muted:    '#a09080',
  modal:    '#ffffff',
  ok:       '#2a9a55',
  okDim:    'rgba(42,154,85,0.10)',
  err:      '#d03030',
  errDim:   'rgba(208,48,48,0.10)',
};

// Farba akcentu podľa pobočky
const BRANCH_COLORS = {
  'Obchodná': '#b87020',
  'Nivy':     '#1a6fa8',
  'Cubicon':  '#2a8a4a',
  'Levice':   '#7a4ab0',
  'Martin':   '#b04040',
  'Žilina':   '#1a8080',
  'Poprad':   '#7a6020',
  'Prešov':   '#b85828',
  'Košice':   '#2a7860',
};

const hexToRgba = (hex, a) => {
  const [r,g,b] = [hex.slice(1,3),hex.slice(3,5),hex.slice(5,7)].map(s=>parseInt(s,16));
  return `rgba(${r},${g},${b},${a})`;
};

const BRANCH_PIN = '1234';
// Zvýš toto číslo keď zmeníš INIT_INV — všetky pobočky dostanú nový základ
const INV_DATA_VERSION = '2';

const BRANCHES = [
  { name: 'Obchodná', url: 'https://script.google.com/macros/s/AKfycbzlcPT4Yu8Pk-Y_5-9-oOHag0oVsFVS-gAtwujfDqn0yjXwEiKcfKbcVwmoW1UF5te9rA/exec' },
  { name: 'Nivy',     url: 'https://script.google.com/macros/s/AKfycbwXWxgtsrJFEb6s9cEP_sPZujYLYjicaiL881vrroLxlf335Rll9nHkwW1bqWFa_sM4/exec' },
  { name: 'Cubicon',  url: 'URL_POBOCKA_3' },
  { name: 'Levice',   url: 'URL_POBOCKA_4' },
  { name: 'Martin',   url: 'URL_POBOCKA_5' },
  { name: 'Žilina',   url: 'URL_POBOCKA_6' },
  { name: 'Poprad',   url: 'URL_POBOCKA_7' },
  { name: 'Prešov',   url: 'URL_POBOCKA_8' },
  { name: 'Košice',   url: 'URL_POBOCKA_9' },
];

const MONTHS = ['Január','Február','Marec','Apríl','Máj','Jún','Júl','August','September','Október','November','December'];

// Zvýš pri zmene denného/víkendového checklistu — migrácia nahradí úlohy na všetkých zariadeniach
const TASKS_VERSION = '3';

const INIT_TASKS = {
  denné: [
    { id: 101, text: 'Zapnutie umývačky riadu + vyvešať/zvešať handry', done: false, time: null, issue: null },
    { id: 102, text: 'Správne otvorenie pokladne (problémy hlásiť VZ alebo Veve)', done: false, time: null, issue: null },
    { id: 103, text: 'Dať piecť croissanty a praclíky + zapísať teploty chladničiek (návod pri piecke)', done: false, time: null, issue: null },
    { id: 104, text: 'Zapnúť všetky svetlá na oboch poschodiach (systémovo aj ručne)', done: false, time: null, issue: null },
    { id: 105, text: 'Vyloženie umývačky riadu v zázemí (Ut / Št / So)', done: false, time: null, issue: null },
    { id: 106, text: 'Kontrola čistoty rajóna, detského kútika a stolov + poriadok pri kase', done: false, time: null, issue: null },
    { id: 107, text: 'Doplniť malé aj veľké pásky (terminál + kasa) zo skrine na OO alebo z eventovky', done: false, time: null, issue: null },
    { id: 108, text: 'Prevzatie koláčov, báglov a kašičiek + nastajlovať do vitríny (správne dátumy)', done: false, time: null, issue: null },
    { id: 109, text: 'Skontrolovať menu (editácia) + doplniť cashboxy (ceruzka, nálepky, feedbacky)', done: false, time: null, issue: null },
    { id: 110, text: 'Kontrola a zapísanie čistoty WC + doplnenie hygienických potrieb', done: false, time: null, issue: null },
    { id: 111, text: 'Kontrola rezervácií — vypísať na post-it + pripraviť na rezervačné tabuľky', done: false, time: null, issue: null },
    { id: 112, text: 'Zapnutie hudby', done: false, time: null, issue: null },
    { id: 113, text: 'Utrieť prach (lampy, komody…), narovnať stoličky ku stolom, zarovnať menu a vkladky', done: false, time: null, issue: null },
    { id: 114, text: 'Pripraviť karafy s vodou a zásobu naskladaných servítok', done: false, time: null, issue: null },
    { id: 115, text: 'Pripraviť nádoby na bágle (modré mraziace vložky + papier na pečenie)', done: false, time: null, issue: null },
    { id: 116, text: 'Poriadok pod stolmi, pozmetať omrvinky', done: false, time: null, issue: null },
    { id: 117, text: 'Očistiť zapisovací hárok z WC', done: false, time: null, issue: null },
  ],
  víkendové: [
    { id: 200, text: 'Rajón', header: true },
    { id: 201, text: 'Utrieť od prachu komody pri 306, 310, 501 a všetky lampy', done: false, time: null, issue: null },
    { id: 202, text: 'Upratať šuflíky v komode pri vitrínke', done: false, time: null, issue: null },
    { id: 203, text: 'Utrieť bielu skriňu pri 415, skrinku strát a nálezov a detskú stoličku', done: false, time: null, issue: null },
    { id: 204, text: 'Utrieť lištu pozdĺž okna a stoličky s kvetmi', done: false, time: null, issue: null },
    { id: 205, text: 'Utrieť nohy coworku, dvere od WC a lampy nad nimi', done: false, time: null, issue: null },
    { id: 206, text: 'Utrieť kovovú konštrukciu pri 409¾', done: false, time: null, issue: null },
    { id: 207, text: 'Utrieť lupu pri eventovke', done: false, time: null, issue: null },
    { id: 208, text: 'Utrieť zábradlie, logo a košík na medziposchodí', done: false, time: null, issue: null },
    { id: 209, text: 'Upratať eventovú kasu', done: false, time: null, issue: null },
    { id: 210, text: 'Upratať skrinku s kasou, podopĺňať cashboxy', done: false, time: null, issue: null },
    { id: 211, text: 'Dať prať koberec', done: false, time: null, issue: null },
    { id: 212, text: 'Povysávať kreslá', done: false, time: null, issue: null },
    { id: 213, text: 'Vyliať vodu z vitrínky', done: false, time: null, issue: null },
    { id: 214, text: 'Poliať a osprchovať všetky kvety', done: false, time: null, issue: null },
    { id: 215, text: 'Umyť okná', done: false, time: null, issue: null },
    { id: 220, text: 'Bar', header: true },
    { id: 221, text: 'Utrieť od prachu všetky police a všetko na nich', done: false, time: null, issue: null },
    { id: 222, text: 'Utrieť bar pod take-away debničkou, poličky s balenou kávou', done: false, time: null, issue: null },
    { id: 223, text: 'Utrieť stroj pod šálkami, trúbu na croissanty (aj pod ňou)', done: false, time: null, issue: null },
    { id: 224, text: 'Utrieť písmená na bare', done: false, time: null, issue: null },
    { id: 225, text: 'Utrieť diery, kde sú koše na kávu, handry, papier a sklo', done: false, time: null, issue: null },
    { id: 226, text: 'Utrieť lampy od prachu (tak, aby prach nepadal do pohárov)', done: false, time: null, issue: null },
    { id: 227, text: 'Utrieť chladničky a umyť zalepené sirupové fľaše', done: false, time: null, issue: null },
    { id: 228, text: 'Umyť pláta, všetky kýbliky na príbor a nádoby z okna', done: false, time: null, issue: null },
    { id: 229, text: 'Skontrolovať soľ do zmäkčovača vody umývačky (dosypať)', done: false, time: null, issue: null },
    { id: 240, text: 'Zázemie a sklad', header: true },
    { id: 241, text: 'Upratať zrkadlovú skriňu a stôl', done: false, time: null, issue: null },
    { id: 242, text: 'Utrieť chladničku v zázemí — zhora aj zvnútra', done: false, time: null, issue: null },
    { id: 243, text: 'Umyť a doplniť WC', done: false, time: null, issue: null },
    { id: 244, text: 'Vypustiť a odvápniť práčku', done: false, time: null, issue: null },
    { id: 245, text: 'Umyť podlahy', done: false, time: null, issue: null },
    { id: 246, text: 'Utrieť všetky chladničky u Harryho aj vo veľkom sklade', done: false, time: null, issue: null },
    { id: 247, text: 'Umyť výlevku', done: false, time: null, issue: null },
    { id: 248, text: 'Upratať u Harryho (ak treba, poutierať dvere a pozmývať)', done: false, time: null, issue: null },
  ],
  mesačné:   [{ id: 301, text: 'Sanitácia mrazničky',    done: false, time: null, issue: null }],
};

const INIT_INV = [
  { category: 'Káva', items: [
    { id: 'p2',  name: 'Káva (goriffee + dvojka)',  portosCode: '2',  unit: 'kg' },
    { id: 'p7',  name: 'Káva na filter/batch',      portosCode: '7',  unit: 'kg' },
    { id: 'p20', name: 'Káva bezkofeínová',          portosCode: '20', unit: 'kg' },
  ]},
  { category: 'Mlieko & smotana', items: [
    { id: 'p13', name: 'Mlieko',                    portosCode: '13', unit: 'l' },
    { id: 'p15', name: 'Mlieko ovsené',             portosCode: '15', unit: 'ks' },
    { id: 'p11', name: 'Mlieko hrachové',           portosCode: '11', unit: 'ks' },
    { id: 'p12', name: 'Smotana na šľahanie 33%',  portosCode: '12', unit: 'ks' },
  ]},
  { category: 'Čaje & horúce nápoje', items: [
    { id: 'p26', name: 'Čaj sypaný zelený',         portosCode: '26', unit: 'g' },
    { id: 'p27', name: 'Čaj sypaný tajná záhrada',  portosCode: '27', unit: 'g' },
    { id: 'p28', name: 'Čaj sypaný čierny',         portosCode: '28', unit: 'g' },
    { id: 'p29', name: 'Čaj sypaný ovocný',         portosCode: '29', unit: 'g' },
    { id: 'p30', name: 'Čaj sypaný bylinkový',      portosCode: '30', unit: 'g' },
    { id: 'p24', name: 'Matcha prášok',             portosCode: '24', unit: 'g' },
    { id: 'p23', name: 'Chai latte surovina',        portosCode: '23', unit: 'kg' },
    { id: 'p25', name: 'Kakao prášok',              portosCode: '25', unit: 'kg' },
    { id: 'p31', name: 'Čokoláda Lyra biela',       portosCode: '31', unit: 'ks' },
    { id: 'p32', name: 'Čokoláda Lyra karamel',     portosCode: '32', unit: 'ks' },
    { id: 'p33', name: 'Čokoláda Lyra mliečna',     portosCode: '33', unit: 'ks' },
    { id: 'p34', name: 'Čokoláda Lyra tmavá',       portosCode: '34', unit: 'ks' },
  ]},
  { category: 'Sirupy', items: [
    { id: 'p1',       name: 'Sirup marhula-zazvor',              portosCode: '1',       unit: 'l' },
    { id: 'p4',       name: 'Sirup pomaranč-škorica',            portosCode: '4',       unit: 'l' },
    { id: 'p9',       name: 'Sirup passionfruit-mandarínka',     portosCode: '9',       unit: 'l' },
    { id: 'p14',      name: 'Sirup slaný karamel',               portosCode: '14',      unit: 'l' },
    { id: 'p16',      name: 'Sirup kokos',                       portosCode: '16',      unit: 'l' },
    { id: 'p17',      name: 'Sirup baza-citrón',                 portosCode: '17',      unit: 'l' },
    { id: 'p19',      name: 'Sirup lieskový oriešok',            portosCode: '19',      unit: 'l' },
    { id: 'p61',      name: 'Sirup malina',                      portosCode: '61',      unit: 'l' },
    { id: 'p71',      name: 'Sirup pink guava',                  portosCode: '71',      unit: 'l' },
    { id: 'p76',      name: 'Sirup pomaranč-mrkva',              portosCode: '76',      unit: 'l' },
    { id: 'p77',      name: 'Sirup vanilka do kávy',             portosCode: '77',      unit: 'l' },
    { id: 'p83',      name: 'Sirup zelené jablko-zelený čaj',   portosCode: '83',      unit: 'l' },
    { id: 'p85',      name: 'Sirup jahoda-jasmín',               portosCode: '85',      unit: 'l' },
    { id: 'p998303',  name: 'Sirup levandula arónia vlčie',      portosCode: '998303',  unit: 'l' },
    { id: 'p998304',  name: 'Sirup spicy vlčie',                 portosCode: '998304',  unit: 'l' },
    { id: 'p998306',  name: 'Sirup pumpkin spice',               portosCode: '998306',  unit: 'l' },
    { id: 'p2984587', name: 'Sirup malina-cascara vlčie',        portosCode: '2984587', unit: 'l' },
    { id: 'p2984591', name: 'Sirup biela čokoláda drinkera',     portosCode: '2984591', unit: 'l' },
    { id: 'p2984592', name: 'Sirup rakytník',                    portosCode: '2984592', unit: 'l' },
    { id: 'p3297128', name: 'Egreš-kamilka sirup vlčie',         portosCode: '3297128', unit: 'l' },
    { id: 'p3297129', name: 'Spicy berry sirup gastrovia',       portosCode: '3297129', unit: 'l' },
    { id: 'p3297131', name: 'Sirup pistácia 1882',               portosCode: '3297131', unit: 'l' },
    { id: 'p3374742', name: 'Sirup perník vlčie',                portosCode: '3374742', unit: 'l' },
    { id: 'p3634834', name: 'Medový sirup gastrovia',            portosCode: '3634834', unit: 'l' },
    { id: 'p3643529', name: 'Citrus gang sirup vlčie',           portosCode: '3643529', unit: 'l' },
    { id: 'p3643530', name: 'Sirup broskyňa-biely čaj vlčie',   portosCode: '3643530', unit: 'l' },
  ]},
  { category: 'Ovocie & zelenina', items: [
    { id: 'p3',       name: 'Zazvor surovina',         portosCode: '3',       unit: 'kg' },
    { id: 'p6',       name: 'Pomaranče',               portosCode: '6',       unit: 'kg' },
    { id: 'p8',       name: 'Mandarínky kompót',       portosCode: '8',       unit: 'kg' },
    { id: 'p10',      name: 'Mäta',                    portosCode: '10',      unit: 'kg' },
    { id: 'p18',      name: 'Citróny',                 portosCode: '18',      unit: 'kg' },
    { id: 'p59',      name: 'Cvikla parená',           portosCode: '59',      unit: 'kg' },
    { id: 'p60',      name: 'Jahody mrazené',          portosCode: '60',      unit: 'kg' },
    { id: 'p62',      name: 'Maliny mrazené',          portosCode: '62',      unit: 'kg' },
    { id: 'p63',      name: 'Banány',                  portosCode: '63',      unit: 'kg' },
    { id: 'p64',      name: 'Pyré mango',              portosCode: '64',      unit: 'kg' },
    { id: 'p65',      name: 'Špenát kocka',            portosCode: '65',      unit: 'kg' },
    { id: 'p68',      name: 'Grep',                    portosCode: '68',      unit: 'kg' },
    { id: 'p81',      name: 'Jablká sušené',           portosCode: '81',      unit: 'kg' },
    { id: 'p84',      name: 'Lesná zmes mrazená',      portosCode: '84',      unit: 'kg' },
    { id: 'p86',      name: 'Jahody čerstvé',          portosCode: '86',      unit: 'kg' },
    { id: 'p2984584', name: 'Pyré jahoda',             portosCode: '2984584', unit: 'l' },
    { id: 'p2984585', name: 'Uhorka',                  portosCode: '2984585', unit: 'kg' },
    { id: 'p2984586', name: 'Rozmarín',                portosCode: '2984586', unit: 'kg' },
    { id: 'p2984588', name: 'Cascara kávové čerešne',  portosCode: '2984588', unit: 'kg' },
    { id: 'p3297126', name: 'Černica pyré lunys',      portosCode: '3297126', unit: 'l' },
    { id: 'p3297127', name: 'Hruškové pyré lunys',     portosCode: '3297127', unit: 'l' },
    { id: 'p3298512', name: 'Hruška kompót',           portosCode: '3298512', unit: 'kg' },
    { id: 'p3643531', name: 'Broskyňa kompót',         portosCode: '3643531', unit: 'kg' },
  ]},
  { category: 'Koláče & torty', items: [
    { id: 'p36',      name: 'Kuba torta s parížskou šľahačkou',        portosCode: '36',      unit: 'ks' },
    { id: 'p37',      name: 'Bezlepková maková torta s višňami',        portosCode: '37',      unit: 'ks' },
    { id: 'p38',      name: 'Passion fruit cake',                       portosCode: '38',      unit: 'ks' },
    { id: 'p39',      name: 'Zimný mrkvový koláč',                      portosCode: '39',      unit: 'ks' },
    { id: 'p41',      name: 'Ruby fruit cake',                          portosCode: '41',      unit: 'ks' },
    { id: 'p42',      name: 'Jahodovo-čokoládový vegánsky koláčik',    portosCode: '42',      unit: 'ks' },
    { id: 'p43',      name: 'Bezlepkový Makovo-slivkový cheesecake',   portosCode: '43',      unit: 'ks' },
    { id: 'p44',      name: 'Manuka medová torta',                      portosCode: '44',      unit: 'ks' },
    { id: 'p45',      name: 'Cheesecake z karamel. sušienok Lotus',    portosCode: '45',      unit: 'ks' },
    { id: 'p46',      name: 'Tradičná Sacher torta',                    portosCode: '46',      unit: 'ks' },
    { id: 'p48',      name: 'Malinovo-čokoládový brownie FXF',         portosCode: '48',      unit: 'ks' },
    { id: 'p49',      name: 'Cheesecake Rafaello',                      portosCode: '49',      unit: 'ks' },
    { id: 'p50',      name: 'Foxforďácky čučočíz s banánmi',           portosCode: '50',      unit: 'ks' },
    { id: 'p173598',  name: 'Orieškový karamel bezlepku',              portosCode: '173598',  unit: 'ks' },
    { id: 'p233048',  name: 'Oreo cheesecake',                          portosCode: '233048',  unit: 'ks' },
    { id: 'p233199',  name: 'Tiramisu cake / Arabica Tiramisu',        portosCode: '233199',  unit: 'ks' },
    { id: 'p233232',  name: 'Vegánsky čokoládový cheesecake',          portosCode: '233232',  unit: 'ks' },
    { id: 'p998294',  name: 'Bezlepková vanilkovo-jahodová torta',     portosCode: '998294',  unit: 'ks' },
    { id: 'p998295',  name: 'Pistachio delight cake',                  portosCode: '998295',  unit: 'ks' },
    { id: 'p998296',  name: 'Malinový koláč s bielou čokoládou',      portosCode: '998296',  unit: 'ks' },
    { id: 'p998297',  name: 'Truffle cake',                             portosCode: '998297',  unit: 'ks' },
    { id: 'p998298',  name: 'Malinový bezlepkový cheesecake',          portosCode: '998298',  unit: 'ks' },
    { id: 'p998299',  name: 'Parížska vegánska tortička',              portosCode: '998299',  unit: 'ks' },
    { id: 'p998307',  name: 'Banánovo-orieškový bezlepkový',           portosCode: '998307',  unit: 'ks' },
    { id: 'p998308',  name: 'Black&White čokokrém',                    portosCode: '998308',  unit: 'ks' },
    { id: 'p998309',  name: 'Oreo Noire cake',                         portosCode: '998309',  unit: 'ks' },
    { id: 'p3175521', name: 'Mandľová tortička / Almond cake',         portosCode: '3175521', unit: 'ks' },
    { id: 'p3175523', name: 'Citronové tiramisu',                       portosCode: '3175523', unit: 'ks' },
    { id: 'p3175529', name: 'Vegánsky pistáciový koláčik',             portosCode: '3175529', unit: 'ks' },
    { id: 'p3175531', name: 'Jahodový cheesecake',                      portosCode: '3175531', unit: 'ks' },
    { id: 'p3175533', name: 'Svieži bazový cheesecake',                portosCode: '3175533', unit: 'ks' },
    { id: 'p3175537', name: 'Zamatová tortička',                        portosCode: '3175537', unit: 'ks' },
    { id: 'p3361219', name: 'Pear & caramel cheesecake',               portosCode: '3361219', unit: 'ks' },
    { id: 'p3363931', name: 'Foret noire cake / Malinovo-čokoládová', portosCode: '3363931', unit: 'ks' },
    { id: 'p3363937', name: 'Čokoládovo-zázvorový bezlepkáč',         portosCode: '3363937', unit: 'ks' },
    { id: 'p3553255', name: 'Náš kokosový sen',                        portosCode: '3553255', unit: 'ks' },
    { id: 'p3553257', name: 'Lotus vegan cheesecake',                  portosCode: '3553257', unit: 'ks' },
    { id: 'p3553429', name: 'Oreo vegan cheesecake',                   portosCode: '3553429', unit: 'ks' },
  ]},
  { category: 'Jedlo & pečivo', items: [
    { id: 'p51',      name: 'Grilážky mini 8ks',                 portosCode: '51',      unit: 'ks' },
    { id: 'p52',      name: 'Bugu kaša / OATkick',               portosCode: '52',      unit: 'ks' },
    { id: 'p53',      name: 'Bágel šunka',                       portosCode: '53',      unit: 'ks' },
    { id: 'p54',      name: 'Bágel vegetariánsky',               portosCode: '54',      unit: 'ks' },
    { id: 'p55',      name: 'Croissant maslový 80g',             portosCode: '55',      unit: 'ks' },
    { id: 'p998300',  name: 'Focaccia vegán',                    portosCode: '998300',  unit: 'ks' },
    { id: 'p998310',  name: 'Bagel vajce a mozzarella',          portosCode: '998310',  unit: 'ks' },
    { id: 'p3191770', name: 'Humus surovina',                    portosCode: '3191770', unit: 'kg' },
    { id: 'p3221463', name: 'Praclík',                           portosCode: '3221463', unit: 'ks' },
    { id: 'p3643532', name: 'Praclík slaný (ozdoba na affogato)',portosCode: '3643532', unit: 'ks' },
    { id: 'p3660123', name: 'Doris Cookies 80g',                 portosCode: '3660123', unit: 'ks' },
    { id: 'p3660125', name: 'Doris Cookies 110g',                portosCode: '3660125', unit: 'ks' },
  ]},
  { category: 'Alkohol', items: [
    { id: 'p69',      name: 'Beefeater gin',                portosCode: '69',      unit: 'ks' },
    { id: 'p70',      name: 'Rum Bacardi Oakheart',         portosCode: '70',      unit: 'ks' },
    { id: 'p72',      name: 'Cabernet Fresh červené víno',  portosCode: '72',      unit: 'ks' },
    { id: 'p73',      name: 'Sauvignon Blanc Fresh',        portosCode: '73',      unit: 'ks' },
    { id: 'p74',      name: 'Prosecco Brut Zardetto',       portosCode: '74',      unit: 'ks' },
    { id: 'p75',      name: 'Nochino ruby',                 portosCode: '75',      unit: 'ks' },
    { id: 'p82',      name: 'Aperol 11%',                   portosCode: '82',      unit: 'ks' },
    { id: 'p2984589', name: 'Nochino citrus',               portosCode: '2984589', unit: 'ks' },
  ]},
  { category: 'Nápoje & drinky', items: [
    { id: 'p21',      name: 'Tonic rozlievaný',           portosCode: '21',      unit: 'l' },
    { id: 'p161786',  name: 'Rajec Sýtený 0.33l',         portosCode: '161786',  unit: 'ks' },
    { id: 'p161787',  name: 'Rajec Nesýtený 0.33l',       portosCode: '161787',  unit: 'ks' },
    { id: 'p161955',  name: 'Rajec Jemne sýtený 0.33l',  portosCode: '161955',  unit: 'ks' },
    { id: 'p233071',  name: 'Pijo Bio ovocná šťava 250ml',portosCode: '233071',  unit: 'ks' },
    { id: 'p233249',  name: 'Froosh smoothie 250ml',       portosCode: '233249',  unit: 'ks' },
    { id: 'p233350',  name: 'Fentimans Cola 275ml',        portosCode: '233350',  unit: 'ks' },
    { id: 'p233623',  name: 'Thomas Henry tonic 200ml',   portosCode: '233623',  unit: 'ks' },
    { id: 'p233671',  name: 'Něco jako cola 330ml',        portosCode: '233671',  unit: 'ks' },
    { id: 'p998305',  name: 'Jablková šťava',              portosCode: '998305',  unit: 'l' },
    { id: 'p3298183', name: 'Curiosa ovocný džús',         portosCode: '3298183', unit: 'ks' },
    { id: 'p3643527', name: 'Kokosová voda',               portosCode: '3643527', unit: 'l' },
    { id: 'p3658351', name: 'Targa tonic',                 portosCode: '3658351', unit: 'ks' },
  ]},
  { category: 'Zmrzlina & dželato', items: [
    { id: 'p22',     name: 'Zmrzlina vanilka',                    portosCode: '22',     unit: 'ks' },
    { id: 'p233302', name: 'Dželato malinový cheesecake',         portosCode: '233302', unit: 'ks' },
    { id: 'p233303', name: 'Dželato čoko-koko vegán',             portosCode: '233303', unit: 'ks' },
    { id: 'p233304', name: 'Dželato Sorbet citrón+mäta+limetka', portosCode: '233304', unit: 'ks' },
    { id: 'p233305', name: 'Dželato Sorbet lesná zmes',           portosCode: '233305', unit: 'ks' },
  ]},
  { category: 'Suroviny & doplnky', items: [
    { id: 'p5',       name: 'Foxid Acid',                   portosCode: '5',       unit: 'ks' },
    { id: 'p35',      name: 'Med k čaju',                   portosCode: '35',      unit: 'ks' },
    { id: 'p56',      name: 'Slowtella',                    portosCode: '56',      unit: 'kg' },
    { id: 'p57',      name: 'Maslo',                        portosCode: '57',      unit: 'kg' },
    { id: 'p58',      name: 'Džem malina/jahoda',           portosCode: '58',      unit: 'kg' },
    { id: 'p78',      name: 'Cvikla prášok GymBeam',        portosCode: '78',      unit: 'g' },
    { id: 'p79',      name: 'Proteín do smoothie GymBeam',  portosCode: '79',      unit: 'g' },
    { id: 'p80',      name: 'Spirulína do smoothie',        portosCode: '80',      unit: 'g' },
    { id: 'p2984590', name: 'Modrý prach Butterfly pea',   portosCode: '2984590', unit: 'kg' },
    { id: 'p998302',  name: 'Pistaciový krém lunys',        portosCode: '998302',  unit: 'kg' },
    { id: 'p3297130', name: 'Pistaciový topping na premix', portosCode: '3297130', unit: 'kg' },
    { id: 'p3643526', name: 'Kokosový krém (kokos-smotana)',portosCode: '3643526', unit: 'l' },
    { id: 'p3643528', name: 'Kokosové lupene',              portosCode: '3643528', unit: 'kg' },
  ]},
  { category: 'Riad & merch', items: [
    { id: 'p233279', name: 'Dripper V60 02 porcelánový',        portosCode: '233279', unit: 'ks' },
    { id: 'p233281', name: 'Čajník CoffeeArt 0,53l',            portosCode: '233281', unit: 'ks' },
    { id: 'p233282', name: 'Chemex CM-6A',                       portosCode: '233282', unit: 'ks' },
    { id: 'p233285', name: 'Šálka 80ml Loveramics + podšálka',  portosCode: '233285', unit: 'ks' },
    { id: 'p233286', name: 'Šálka 200ml Loveramics + podšálka', portosCode: '233286', unit: 'ks' },
    { id: 'p233295', name: 'Kinto Unimug Hrnček na čaj 350ml',  portosCode: '233295', unit: 'ks' },
    { id: 'p233296', name: 'Kľúčenka kávová',                   portosCode: '233296', unit: 'ks' },
    { id: 'p233297', name: 'Odznak kávový',                      portosCode: '233297', unit: 'ks' },
    { id: 'p233129', name: 'Obal na koláč/kávu',                 portosCode: '233129', unit: 'ks' },
    { id: 'p998291', name: 'Vákuová dóza Coffeevac 500g',        portosCode: '998291', unit: 'ks' },
    { id: 'p998293', name: 'Vákuová dóza Coffeevac 250g',        portosCode: '998293', unit: 'ks' },
  ]},
];

// Zvýš pri zmene zoznamu chladiacich zariadení — migrácia nahradí polia na všetkých zariadeniach
const TEMP_FIELDS_VERSION = '1';
// Chladiace/mraziace zariadenia podľa tabuľky „Kontrola teplôt" (prevádzka Obchodná).
// Mrazničky majú záporný limit (≤ -18 °C) — tempColor s tým počíta.
const INIT_TEMP_FIELDS = [
  { key: 'ch1', label: 'CH1 – biela, sklad (sirupy, koláče)', max: '≤ 5 °C' },
  { key: 'ch2', label: 'CH2 – chladnička',                    max: '≤ 5 °C' },
  { key: 'ch3', label: 'CH3 – nerez, sklad (ovocie)',         max: '≤ 5 °C' },
  { key: 'ch4', label: 'CH4 – malá biela (zelenina, ovocie)', max: '≤ 5 °C' },
  { key: 'ch5', label: 'CH5 – malá biela (koláče, sirupy)',   max: '≤ 5 °C' },
  { key: 'ch6', label: 'CH6 – box baristi (za barom)',        max: '≤ 5 °C' },
  { key: 'ch7', label: 'CH7 – box (ovocie, sirupy)',          max: '≤ 5 °C' },
  { key: 'm1',  label: 'M1 – veľká mraznička (sklad)',        max: '≤ -18 °C' },
  { key: 'm2',  label: 'M2 – mraznička (za barom)',           max: '≤ -18 °C' },
  { key: 'm3',  label: 'M3 – malá nerez mraznička (sklad)',   max: '≤ -18 °C' },
  { key: 'vt',  label: 'VT – vitrína (sladké)',               max: '≤ 10 °C' },
];

const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Horné limity pre odpisy podľa jednotky — nad limit appka vyzve na kontrolu jednotky (napr. 20 kg kávy = omyl, myslel g)
const ODPIS_UNIT_LIMITS = { kg: 10, l: 15, g: 1000, ml: 2000, ks: 100, bal: 30 };

// ── LOGO ─────────────────────────────────────────────────────────────────────
const Logo = ({ size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.26),
    background: 'linear-gradient(145deg, #2e1f0e, #4a3218)',
    border: `1.5px solid ${BASE_C.goldLine}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    boxShadow: `0 0 20px rgba(224,160,58,0.15), 0 4px 12px rgba(0,0,0,0.5)`,
  }}>
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <path d="M30 3L57 18.5V41.5L30 57L3 41.5V18.5Z" fill={BASE_C.gold} opacity="0.95" />
      <path d="M30 15L46 24.5V40.5L30 50L14 40.5V24.5Z" fill="rgba(0,0,0,0.5)" />
      <text x="30" y="37" textAnchor="middle" fill="white" fontSize="20" fontWeight="800" fontFamily="-apple-system,sans-serif">F</text>
    </svg>
  </div>
);

// ── GLASS CARD ────────────────────────────────────────────────────────────────
const Glass = ({ children, style, accent }) => (
  <div style={{
    background: BASE_C.panel,
    border: `1px solid ${accent ? BASE_C.borderM : BASE_C.border}`,
    borderRadius: 20,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    marginBottom: 10,
    overflow: 'hidden',
    boxShadow: '0 2px 14px rgba(0,0,0,0.07)',
    ...style,
  }}>{children}</div>
);

// ── PILL LABEL ────────────────────────────────────────────────────────────────
const Tag = ({ text }) => (
  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.3, color: BASE_C.sub }}>{text}</span>
);

// ── INPUT ─────────────────────────────────────────────────────────────────────
const Inp = React.forwardRef(({ style, shake, ...props }, ref) => (
  <input ref={ref} {...props} className={shake ? 'shake' : ''} style={{
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: `1px solid ${BASE_C.border}`, fontSize: 15, outline: 'none',
    boxSizing: 'border-box', background: 'rgba(255,255,255,0.85)',
    color: BASE_C.text, fontFamily: 'inherit',
    transition: 'border-color 0.2s',
    ...style,
  }} />
));

// ── Local day key — YYYY-MM-DD v lokálnom čase (nie UTC, ktoré drift-uje v CET/CEST) ──
function localDayKey(d) {
  const date = d || new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Safe JSON.parse — defenzívne čítanie localStorage (predchádza white-screen pri poškodenom kľúči) ──
function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch (_) {
    return fallback;
  }
}

// ── Offline-aware send: pošle alebo uloží do fronty (modulová úroveň, bez React stavu) ──
function sendOrQueue(url, type, payload) {
  // Ochrana proti placeholder URL pre nenakonfigurované pobočky
  if (!url || /^URL_POBOCKA/.test(url) || !/^https?:\/\//.test(url)) {
    console.warn('sendOrQueue: skipped — placeholder/invalid URL', url);
    return;
  }
  const token = process.env.REACT_APP_GAS_TOKEN || '';
  const body = JSON.stringify({ type, ...payload, _token: token });
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    // Uložiť do localStorage fronty — App effect ju odošle keď príde online
    try {
      const raw = localStorage.getItem('foxford-offline-queue');
      const q = raw ? JSON.parse(raw) : [];
      q.push({ type, payload, url, ts: Date.now() });
      localStorage.setItem('foxford-offline-queue', JSON.stringify(q));
    } catch (_) {}
    return;
  }
  fetch(url, { method:'POST', mode:'no-cors', headers:{ 'Content-Type':'application/json' }, body }).catch(() => {});
}

// ── DAILY CLOSE — odošle denné úlohy + odpisy končiaceho dňa do GS a vyresetuje stav ──
// Volá sa pri polnoci aj pri otvorení appky ak sa polnoc preskočila (zatvorená appka).
function performDailyClose(endingDate) {
  try {
    const branch = localStorage.getItem('foxford-branch') || '';
    const url = (BRANCHES.find(b => b.name === branch) || BRANCHES[0]).url;
    const sendDate = endingDate.toLocaleDateString('sk-SK');
    const endingDayKey = localDayKey(endingDate); // lokálny dátum (CET/CEST safe)

    // 1) Odoslať denné úlohy ak bola aktivita
    let tasksData = {};
    try { tasksData = JSON.parse(localStorage.getItem('foxford-tasks')) || {}; } catch (_) {}
    let inspectorsData = {};
    try { inspectorsData = JSON.parse(localStorage.getItem('foxford-inspectors')) || {}; } catch (_) {}
    const denne = Array.isArray(tasksData.denné) ? tasksData.denné : [];
    const inspectorDenne = (inspectorsData.denné || '').trim();
    const hadActivity = denne.some(t => t.done || t.issue) || inspectorDenne;
    if (denne.length > 0 && hadActivity) {
      sendOrQueue(url, 'tasks_summary', {
        date: sendDate,
        category: 'denné',
        inspector: inspectorDenne || 'Anonym',
        tasks: denne.map(t => ({
          text: t.text, done: !!t.done,
          time: t.time || null, date: t.date || null, issue: t.issue || null, by: t.by || null,
        })),
      });
    }

    // 2) Odoslať odpisy končiaceho dňa
    let odpisy = {};
    try { odpisy = JSON.parse(localStorage.getItem('foxford-odpisy')) || {}; } catch (_) {}
    const rawDay = odpisy[endingDayKey];
    const dayData = !rawDay ? null : Array.isArray(rawDay) ? { entries: rawDay, note: '' } : rawDay;
    const filled = (dayData?.entries || []).filter(e => e.qty);
    if (filled.length > 0) {
      const author = localStorage.getItem('foxford-odpisy-author') || '';
      sendOrQueue(url, 'odpis_daily', {
        date: sendDate,
        author,
        note: dayData.note || '',
        entries: filled.map(e => ({
          name: e.name,
          qty: parseFloat((e.qty || '').toString().replace(',','.')) || 0,
          unit: e.unit,
          reason: e.reason || 'Spotreba',
        })),
      });
    }

    // 2b) Odoslať dennú evidenciu alkoholu končiaceho dňa
    try {
      const alkKatalog = JSON.parse(localStorage.getItem('foxford-alkohol-katalog')) || [];
      const alkData = JSON.parse(localStorage.getItem('foxford-alkohol')) || {};
      const dayCounts = alkData[endingDayKey] || {};
      const licencia = localStorage.getItem('foxford-alkohol-licencia') || '';
      const alkAuthor = localStorage.getItem('foxford-alkohol-author') || '';
      // Posielame len fľaše s nenulovým počtom otvorených
      const alkEntries = alkKatalog
        .map(b => ({ name: b.name, type: b.type || '', ean: b.ean || '', open: parseInt(dayCounts[b.id], 10) || 0 }))
        .filter(e => e.open > 0);
      if (alkEntries.length > 0) {
        sendOrQueue(url, 'alkohol_daily', {
          date: sendDate,
          licencia,
          author: alkAuthor,
          entries: alkEntries,
        });
      }
    } catch (e) { console.error('alkohol daily close failed:', e); }

    // 3) Reset localStorage stavu pre nový deň — zachovať vlastné úlohy, len resetnúť stav
    const baseDenne = (Array.isArray(tasksData.denné) && tasksData.denné.length > 0) ? tasksData.denné : INIT_TASKS.denné;
    const resetTasks = { ...tasksData, denné: baseDenne.map(t => ({ ...t, done: false, time: null, date: null, issue: null, by: null })) };
    localStorage.setItem('foxford-tasks', JSON.stringify(resetTasks));
    const resetInspectors = { ...inspectorsData, denné: '' };
    localStorage.setItem('foxford-inspectors', JSON.stringify(resetInspectors));
    localStorage.setItem('foxford-haccp-date', '');
    localStorage.setItem('foxford-haccp-date-vecerne', '');
    // Pozn.: `foxford-last-reset-date` zapisuje volajúci (catch-up loop / midnight timer)
  } catch (err) {
    console.error('performDailyClose failed:', err);
  }
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {

  // Catch-up: ak appka bola zatvorená cez polnoc — gated cez ref aby bežalo presne raz na mount
  const _catchupRan = useRef(false);
  if (!_catchupRan.current && typeof window !== 'undefined') {
    _catchupRan.current = true;
    const _today = new Date().toDateString();
    const _last  = localStorage.getItem('foxford-last-reset-date');
    if (_last && _last !== _today) {
      // Loop day-by-day cez všetky preskočené dni (handluje multi-day skip)
      let cursor = new Date(_last);
      let safety = 0; // bezpečnostná zarážka aby sa nezacyklilo
      const SAFETY_MAX = 60;
      while (!isNaN(cursor.getTime()) && cursor.toDateString() !== _today && safety < SAFETY_MAX) {
        performDailyClose(cursor);
        cursor.setDate(cursor.getDate() + 1);
        localStorage.setItem('foxford-last-reset-date', cursor.toDateString());
        safety++;
      }
      // Ak appka bola zatvorená dlhšie ako safety limit, varuj a aspoň posledný deň skús zavrieť
      if (safety >= SAFETY_MAX && cursor.toDateString() !== _today) {
        console.warn(`Catch-up: preskočených >${SAFETY_MAX} dní, posielam dáta posledného (včerajšieho) dňa`);
        performDailyClose(new Date(Date.now() - 86400000));
      }
      // Bezpečnosť: uistiť sa že last-reset-date je dnes
      localStorage.setItem('foxford-last-reset-date', _today);
    } else if (!_last) {
      // Prvé spustenie — zaznamenať dnešok
      localStorage.setItem('foxford-last-reset-date', _today);
    }
  }

  const [loading, setLoading]   = useState(true);
  const [online, setOnline]     = useState(navigator.onLine);
  const [uiZoom, setUiZoom]     = useState(() => parseFloat(localStorage.getItem('foxford-zoom') || '1'));
  const [tab, setTab]           = useState('tasks');
  const [subTab, setSubTab]     = useState('denné');
  const [expCat, setExpCat]     = useState(null);
  const [quickTask, setQuickTask] = useState(null);
  const [pressingId, setPressingId] = useState(null);
  const [pressPos, setPressPos] = useState({ x: 0, y: 0 });
  const [bouncingCheck, setBouncingCheck] = useState(null);
  const [lockedAlert, setLockedAlert] = useState(null); // { shift }
  const [invNumpad, setInvNumpad]     = useState(null); // { itemId, rowId, value, unit, itemName }
  const [qtyWarn, setQtyWarn]         = useState(null); // { itemId, rowId, value, unit, itemName } — odpis nad limit jednotky
  const [confirmUndo, setConfirmUndo] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(null); // úloha na zmazanie (potvrdenie)
  const [confirmEditMode, setConfirmEditMode] = useState(false);   // potvrdenie pred prepnutím editácie
  const [lastHaccpDate, setLastHaccpDate] = useState(localStorage.getItem('foxford-haccp-date') || '');
  const [lastHaccpDateVecerne, setLastHaccpDateVecerne] = useState(localStorage.getItem('foxford-haccp-date-vecerne') || '');
  const [haccpShift, setHaccpShift] = useState('ranné');
  const [tempsVecerne, setTempsVecerne] = useState(() => {
    const fields = safeParse('foxford-temp-fields', INIT_TEMP_FIELDS);
    return fields.reduce((a, f) => ({ ...a, [f.key]: '' }), {});
  });
  const [invSearch, setInvSearch] = useState('');

  const timerRef = useRef(null);
  const longPress  = useRef(false);
  const inspRef  = useRef(null);
  const nameRef  = useRef(null);
  // Priama referencia na aktuálne focusnutý <input> — pre spoľahlivé zatváranie klávesnice
  const activeInputRef = useRef(null);
  const dismissKeyboard = () => {
    const input = activeInputRef.current;
    if (!input) return;
    activeInputRef.current = null;

    const savedScroll = window.scrollY;

    // Uzamkneme scroll pozíciu na 600ms — akýkoľvek pokus Androidu scrollnúť
    // (keyboard close, DOM zmena, focus jump) sa okamžite koriguje späť
    let locked = true;
    const lockFn = () => { if (locked) window.scrollTo(0, savedScroll); };
    window.addEventListener('scroll', lockFn, { passive: true });
    setTimeout(() => {
      locked = false;
      window.removeEventListener('scroll', lockFn);
    }, 600);

    input.blur();
    document.body.focus();
  };
  const touchX          = useRef(null);
  const touchY          = useRef(null);
  const taskTouchMoved  = useRef(false); // true ak sa prst hýbal pri úlohe — blokuje onClick
  const tapStartRef     = useRef({ x: 0, y: 0 }); // sleduje štart dotyku pre rozlíšenie tap vs swipe
  const ocrInputRef     = useRef(null);

  const [tasks, setTasks] = useState(() => {
    // Catch-up loop nad nami už zapísal reset do localStorage ak preskočili sa dni,
    // takže tu už len bezpečne načítame uložené úlohy.
    const saved = localStorage.getItem('foxford-tasks');
    let parsed = INIT_TASKS;
    if (saved) { try { parsed = JSON.parse(saved); } catch (_) { parsed = INIT_TASKS; } }
    // Migrácia checklistu: pri novej verzii nahraď denné + víkendové novým základom.
    // Zachováva done/time/issue/by pre úlohy s rovnakým ID — len text/štruktúra sa obnoví.
    // (mesačné zostávajú zachované)
    if (localStorage.getItem('foxford-tasks-version') !== TASKS_VERSION) {
      const mergeDone = (newList, oldList) => {
        const oldMap = (Array.isArray(oldList) ? oldList : []).reduce((m, t) => { m[t.id] = t; return m; }, {});
        return newList.map(t => {
          const old = oldMap[t.id];
          return old && (old.done || old.issue) ? { ...t, done: old.done, time: old.time ?? null, issue: old.issue ?? null, by: old.by ?? null } : { ...t };
        });
      };
      parsed = {
        ...parsed,
        denné: mergeDone(INIT_TASKS.denné, parsed.denné),
        víkendové: mergeDone(INIT_TASKS.víkendové, parsed.víkendové),
      };
      localStorage.setItem('foxford-tasks-version', TASKS_VERSION);
      localStorage.setItem('foxford-tasks', JSON.stringify(parsed));
    }
    return parsed;
  });

  const [inspectors, setInspectors] = useState(() => safeParse('foxford-inspectors', { denné: '', víkendové: '', mesačné: '' }));
  const [newTask, setNewTask]       = useState('');
  const [tempFields, setTempFields] = useState(() => {
    // Migrácia: pri novej verzii nahraď zoznam zariadení na všetkých zariadeniach (prepíše vlastné úpravy)
    if (localStorage.getItem('foxford-temp-fields-version') !== TEMP_FIELDS_VERSION) {
      localStorage.setItem('foxford-temp-fields-version', TEMP_FIELDS_VERSION);
      localStorage.setItem('foxford-temp-fields', JSON.stringify(INIT_TEMP_FIELDS));
      return INIT_TEMP_FIELDS;
    }
    return safeParse('foxford-temp-fields', INIT_TEMP_FIELDS);
  });
  const [temps, setTemps]           = useState(() => {
    const fields = safeParse('foxford-temp-fields', INIT_TEMP_FIELDS);
    return fields.reduce((a, f) => ({ ...a, [f.key]: '' }), {});
  });
  const [newTempLabel, setNewTempLabel] = useState('');
  const [newTempMax,   setNewTempMax]   = useState('');
  const [confirmRemoveTemp, setConfirmRemoveTemp] = useState(null);
  const [showAddTemp, setShowAddTemp] = useState(false);
  const [confirmAddTemp, setConfirmAddTemp] = useState(false);
  const [controllerName, setControllerName] = useState('');
  const [selectedMonth, setSelectedMonth]   = useState(MONTHS[new Date().getMonth()]);
  const [invData, setInvData]   = useState(() => {
    const savedVer  = localStorage.getItem('foxford-inv-version');
    const savedData = safeParse('foxford-inventory-data', null);
    // Verzia sedí a dáta existujú → použi lokálne (vrátane úprav pobočky)
    if (savedVer === INV_DATA_VERSION && savedData) return savedData;
    // Nová verzia kódu → štart od INIT_INV, ale zachovaj vlastné pridané položky
    const customItems = safeParse('foxford-custom-items', []);
    if (customItems.length === 0) return INIT_INV;
    const merged = INIT_INV.map(g => ({ ...g, items: [...g.items] }));
    customItems.forEach(({ category, item }) => {
      const group = merged.find(g => g.category === category);
      if (group) group.items.push(item);
      else merged.push({ category, items: [item] });
    });
    return merged;
  });
  const [invQty, setInvQty]     = useState(() => {
    const saved = safeParse('foxford-inventory', {});
    // migrate old string format → new array-of-rows format
    const out = {};
    for (const [key, val] of Object.entries(saved)) {
      out[key] = typeof val === 'string' ? (val ? [{ id: 'r0', label: '', qty: val }] : []) : (Array.isArray(val) ? val : []);
    }
    return out;
  });
  const [invNotes, setInvNotes] = useState(() => safeParse('foxford-inventory-notes', {}));
  const [newCat, setNewCat]     = useState('');
  const [addingTo, setAddingTo] = useState(null);
  const [editMode, setEditMode] = useState(false); // editácia skladu (mazanie/pridávanie) — predvolene vypnuté
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [notes, setNotes]   = useState(() => safeParse('foxford-notes', []));
  const [newNote, setNewNote] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const [celebrateHaccp, setCelebrateHaccp] = useState(false);
  const [confirmResetHaccp, setConfirmResetHaccp] = useState(false);
  const [sending, setSending]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [ocrStatus, setOcrStatus]   = useState(null);
  const [ocrImage, setOcrImage]     = useState(null);
  const [ocrRawText, setOcrRawText] = useState('');
  const [ocrFilledCount, setOcrFilledCount] = useState(0);
  const [missingWarning, setMissingWarning] = useState([]);
  const [haccpMissing, setHaccpMissing] = useState(null); // [labels] nevyplnených teplôt pri odoslaní
  const [confirmExportPdf, setConfirmExportPdf] = useState(false); // potvrdenie PDF exportu odpisov
  const [savedAt, setSavedAt] = useState(null);
  const savedAtThrottle = useRef(0);
  const [branch, setBranch] = useState(() => localStorage.getItem('foxford-branch') || null);
  const [showBranchSelect, setShowBranchSelect] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinStep, setPinStep] = useState(false);
  const [shakeName, setShakeName] = useState(false);
  const [shakeInsp, setShakeInsp] = useState(false);
  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');
  const [notifSettings, setNotifSettings] = useState(() => safeParse('foxford-notif-settings', { enabled: false, time: '09:00' }));
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugText, setBugText] = useState('');
  const [bugAuthor, setBugAuthor] = useState('');
  const [bugSent, setBugSent] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState(() => safeParse('foxford-offline-queue', []));
  const [offlineFlushed, setOfflineFlushed] = useState(0);
  const [now, setNow] = useState(new Date());
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [odpisy, setOdpisy] = useState(() => safeParse('foxford-odpisy', {}));
  const [odpisySearch, setOdpisySearch] = useState('');
  const [odpisySummaryDate, setOdpisySummaryDate] = useState(() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; });
  const [odpisyBrowseKey, setOdpisyBrowseKey] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 1); return localDayKey(d); }); // prehliadač dní — default včera (DST-safe)
  const [odpisyAuthor, setOdpisyAuthor] = useState(() => localStorage.getItem('foxford-odpisy-author') || '');
  // Denné uzávierky kasy — { [dayKey]: { kasa, meno, A..L, gNote, sent } } (H/J/M sa rátajú)
  const [uzavierky, setUzavierky] = useState(() => safeParse('foxford-uzavierky', {}));

  // ── EVIDENCIA ALKOHOLU ─────────────────────────────────────────────────────
  const [alkoholKatalog, setAlkoholKatalog] = useState(() => safeParse('foxford-alkohol-katalog', []));   // [{ id, name, type, ean }]
  const [alkoholLicencia, setAlkoholLicencia] = useState(() => localStorage.getItem('foxford-alkohol-licencia') || '');
  const [alkohol, setAlkohol] = useState(() => safeParse('foxford-alkohol', {}));                          // { [dayKey]: { [bottleId]: count } }
  const [alkoholAuthor, setAlkoholAuthor] = useState(() => localStorage.getItem('foxford-alkohol-author') || '');
  const [newAlkName, setNewAlkName] = useState('');
  const [newAlkType, setNewAlkType] = useState('');
  const [newAlkEan, setNewAlkEan]   = useState('');

  // ── DYNAMICKÁ FARBA POBOČKY ───────────────────────────────────────────────
  const branchGold = (branch && BRANCH_COLORS[branch]) || BASE_C.gold;
  const C = {
    ...BASE_C,
    gold:     branchGold,
    goldDim:  hexToRgba(branchGold, 0.12),
    goldLine: hexToRgba(branchGold, 0.45),
  };

  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    document.documentElement.style.zoom = uiZoom;
    localStorage.setItem('foxford-zoom', uiZoom.toString());
  }, [uiZoom]);

  // ── MIDNIGHT AUTO-RESET + AUTO-SEND DENNÝCH ÚLOH + ODPISOV ────────────────
  // Self-rearming: po každom polnočnom resete sa znovu naplánuje na ďalšiu polnoc.
  // Pri zatvorenej appke catch-up beží pri otvorení (viď začiatok komponentu App).
  useEffect(() => {
    let timer;
    const arm = () => {
      const now = new Date();
      const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
      const ms = midnight - now;
      timer = setTimeout(() => {
        // 1) Odošli denné úlohy a odpisy končiaceho dňa + zapíš reset do localStorage
        performDailyClose(new Date());
        localStorage.setItem('foxford-last-reset-date', new Date().toDateString());
        // 2) Aktualizuj React state (kópia z localStorage)
        setTasks(prev => ({ ...prev, denné: prev.denné.map(t => ({ ...t, done: false, time: null, date: null, issue: null, by: null })) }));
        setInspectors(prev => ({ ...prev, denné: '' }));
        setLastHaccpDate('');
        setLastHaccpDateVecerne('');
        // Reset všetkých temp polí — vrátane akýchkoľvek čo boli pridané po mount-e
        const _resetFields = safeParse('foxford-temp-fields', INIT_TEMP_FIELDS);
        const _emptyTemps = _resetFields.reduce((a, f) => ({ ...a, [f.key]: '' }), {});
        setTemps(prev => ({ ...prev, ..._emptyTemps }));
        setTempsVecerne(prev => ({ ...prev, ..._emptyTemps }));
        setControllerName('');
        // 3) Re-arm na ďalšiu polnoc
        arm();
      }, ms);
    };
    arm();
    return () => { if (timer) clearTimeout(timer); };
  }, []);
  useEffect(() => {
    localStorage.setItem('foxford-tasks',           JSON.stringify(tasks));
    localStorage.setItem('foxford-inspectors',      JSON.stringify(inspectors));
    localStorage.setItem('foxford-temp-fields',     JSON.stringify(tempFields));
    // Uložiť celý katalóg (vrátane lokálnych úprav)
    localStorage.setItem('foxford-inventory-data', JSON.stringify(invData));
    localStorage.setItem('foxford-inv-version',    INV_DATA_VERSION);
    // Záloha vlastných položiek pre migráciu pri budúcom navýšení verzie
    const initIds = new Set(INIT_INV.flatMap(g => g.items.map(i => i.id)));
    const customItems = [];
    invData.forEach(g => g.items.forEach(item => {
      if (!initIds.has(item.id)) customItems.push({ category: g.category, item });
    }));
    localStorage.setItem('foxford-custom-items', JSON.stringify(customItems));
    localStorage.setItem('foxford-inventory',       JSON.stringify(invQty));
    localStorage.setItem('foxford-inventory-notes', JSON.stringify(invNotes));
    localStorage.setItem('foxford-notes',           JSON.stringify(notes));
    localStorage.setItem('foxford-notif-settings',  JSON.stringify(notifSettings));
    localStorage.setItem('foxford-odpisy',          JSON.stringify(odpisy));
    localStorage.setItem('foxford-odpisy-author',   odpisyAuthor);
    localStorage.setItem('foxford-uzavierky',        JSON.stringify(uzavierky));
    localStorage.setItem('foxford-alkohol-katalog', JSON.stringify(alkoholKatalog));
    localStorage.setItem('foxford-alkohol',         JSON.stringify(alkohol));
    localStorage.setItem('foxford-alkohol-licencia', alkoholLicencia);
    localStorage.setItem('foxford-alkohol-author',  alkoholAuthor);
    // Throttle: aktualizuj "uložené o XX:XX" max raz za 30 sekúnd (znižuje zbytočné re-rendery)
    const nowMs = Date.now();
    if (nowMs - savedAtThrottle.current > 30000) {
      savedAtThrottle.current = nowMs;
      setSavedAt(new Date().toLocaleTimeString('sk-SK', { hour:'2-digit', minute:'2-digit' }));
    }
  }, [tasks, inspectors, tempFields, invData, invQty, invNotes, notes, notifSettings, odpisy, odpisyAuthor, uzavierky, alkoholKatalog, alkohol, alkoholLicencia, alkoholAuthor]);

  const scriptUrl = BRANCHES.find(b => b.name === branch)?.url || BRANCHES[0].url;

  const doFetch = (url, type, payload) => {
    if (!url || /^URL_POBOCKA/.test(url) || !/^https?:\/\//.test(url)) {
      console.warn('doFetch: skipped — placeholder/invalid URL', url);
      return;
    }
    fetch(url, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...payload, _token: process.env.REACT_APP_GAS_TOKEN }),
    }).catch(console.error);
  };

  const sendToSheets = (type, payload) => {
    // Neplatná/placeholder URL — nemá zmysel posielať ani queue-ovať (inak by položka navždy visela vo fronte)
    if (!scriptUrl || /^URL_POBOCKA/.test(scriptUrl) || !/^https?:\/\//.test(scriptUrl)) {
      console.warn('sendToSheets: skipped — placeholder/invalid URL', scriptUrl);
      return;
    }
    if (!navigator.onLine) {
      // Uložiť do fronty na neskôr (aj s URL pobočky) — čítame z localStorage nie z closure (stale ref)
      const current = safeParse('foxford-offline-queue', []);
      const q = [...current, { type, payload, url: scriptUrl, ts: Date.now() }];
      setOfflineQueue(q);
      localStorage.setItem('foxford-offline-queue', JSON.stringify(q));
      return;
    }
    doFetch(scriptUrl, type, payload);
  };

  // Odošli frontu keď príde konektivita. Failed položky (network-level) vrátime späť do fronty.
  useEffect(() => {
    if (!online) return;
    const rawQueue = safeParse('foxford-offline-queue', []);
    if (rawQueue.length === 0) return;
    // Položky s neplatnou/placeholder URL natrvalo zahodiť — opakovaný pokus by aj tak nikdy neuspel
    const queue = rawQueue.filter(item =>
      item.url && !/^URL_POBOCKA/.test(item.url) && /^https?:\/\//.test(item.url)
    );
    if (queue.length === 0) {
      // Vo fronte boli len invalid položky — vyčisti ich z localStorage
      setOfflineQueue([]);
      localStorage.removeItem('foxford-offline-queue');
      return;
    }
    // Hneď vyčisti frontu aby sa nezdvojili odoslanie pri rýchlych online/offline prepnutiach
    setOfflineQueue([]);
    localStorage.removeItem('foxford-offline-queue');

    Promise.allSettled(queue.map(item => {
      return fetch(item.url, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: item.type, ...item.payload, _token: process.env.REACT_APP_GAS_TOKEN }),
      });
    })).then(results => {
      const failed = results.map((r, i) => r.status === 'rejected' ? queue[i] : null).filter(Boolean);
      if (failed.length > 0) {
        // Vráť zlyhane položky späť do fronty (zlúči s prípadne novými)
        const current = safeParse('foxford-offline-queue', []);
        const merged = [...current, ...failed];
        localStorage.setItem('foxford-offline-queue', JSON.stringify(merged));
        setOfflineQueue(merged);
      }
      const sentOk = queue.length - failed.length;
      if (sentOk > 0) {
        setOfflineFlushed(sentOk);
        setTimeout(() => setOfflineFlushed(0), 4000);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  // Kľúče dňa (YYYY-MM-DD) — používajú odpisy aj uzávierka; deklarované pred effectmi (TDZ)
  // Kalendárová aritmetika (setDate) je DST-safe — odčítanie 86400000 ms zlyháva v ~1h okne po jarnom prechode na letný čas.
  const todayKey     = localDayKey(new Date());
  const yesterdayKey = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return localDayKey(d); })();

  // Live hodiny — aktualizácia každú sekundu
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Uzávierka: reset o polnoci. Formulár je viazaný na dnešný deň (todayKey) —
  // o polnoci sa todayKey zmení => prázdny formulár pre nový deň.
  // A (zostatok) sa ZÁMERNE NEpredvyplňuje — človek ho ráno reálne prerátava;
  // minulý zostatok mu svieti nad poľom len ako kontrolná informácia.
  // Predvyplníme len číslo kasy (z poslednej uzávierky) pre pohodlie.
  useEffect(() => {
    if (tab !== 'uzavierka') return;
    setUzavierky(prev => {
      if (prev[todayKey]) return prev;
      const prior = Object.keys(prev).filter(k => k < todayKey).sort();
      const last = prior.length ? prev[prior[prior.length - 1]] : null;
      return { ...prev, [todayKey]: { ...UZAV_DEFAULT, kasa: last ? (last.kasa || '') : '' } };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, todayKey]);

  // Responzívna šírka okna
  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const isTablet  = windowWidth >= 768;
  const isDesktop = windowWidth >= 1024;

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  const showNotification = (title, body) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const icon = `${process.env.PUBLIC_URL}/foxford-logo.png.png`;
    const opts = { body, icon, badge: icon, vibrate: [100, 50, 100], tag: 'foxford-reminder', renotify: true };

    // Skús SW notifikáciu s timeoutom 2s, potom fallback na priamu notifikáciu
    let done = false;
    const fallback = setTimeout(() => {
      if (!done) { done = true; try { new Notification(title, { body, icon }); } catch (_) {} }
    }, 2000);

    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.ready
        .then(reg => { clearTimeout(fallback); done = true; reg.showNotification(title, opts); })
        .catch(() => { clearTimeout(fallback); done = true; try { new Notification(title, { body, icon }); } catch (_) {} });
    } else {
      clearTimeout(fallback);
      try { new Notification(title, { body, icon }); } catch (_) {}
    }
  };

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      setNotifSettings(prev => ({ ...prev, enabled: true }));
      setTimeout(() => showNotification('Foxford ☕', 'Notifikácie sú zapnuté! Budeš dostávať denné pripomienky.'), 500);
    }
  };

  // Schedule daily notification — self-rearming (po odpálení sa naplánuje na ďalší deň)
  useEffect(() => {
    if (!notifSettings.enabled || notifPermission !== 'granted') return;
    if (!/^\d{1,2}:\d{2}$/.test(notifSettings.time || '')) return;
    const [h, m] = notifSettings.time.split(':').map(Number);
    let timer;
    const arm = () => {
      const now = new Date();
      const target = new Date(); target.setHours(h, m, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      timer = setTimeout(() => {
        // Čerstvé dáta z localStorage — state v closure by bol zastaraný
        const tasksData = safeParse('foxford-tasks', INIT_TASKS);
        const denne = Array.isArray(tasksData.denné) ? tasksData.denné : [];
        const done = denne.filter(t => t.done || t.issue).length;
        if (done < denne.length) showNotification('Foxford ☕', `Nezabudni na denné úlohy! (${done}/${denne.length} hotovo)`);
        arm();
      }, target - now);
    };
    arm();
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifSettings.enabled, notifSettings.time, notifPermission]);

  // On-open check: if past reminder time and tasks not done, nudge
  useEffect(() => {
    if (!notifSettings.enabled || notifPermission !== 'granted') return;
    if (!/^\d{1,2}:\d{2}$/.test(notifSettings.time || '')) return;
    const [h, m] = notifSettings.time.split(':').map(Number);
    const now = new Date();
    const reminder = new Date(); reminder.setHours(h, m, 0, 0);
    if (now < reminder) return;
    const done = tasks.denné.filter(t => t.done || t.issue).length;
    const total = tasks.denné.length;
    if (done < total) {
      const t = setTimeout(() => showNotification('Foxford ☕', `Nezabudni na denné úlohy! (${done}/${total} hotovo)`), 4000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportPortos = () => {
    const lines = [];
    invData.forEach(group => {
      group.items.forEach(item => {
        const code  = (item.portosCode || '').trim();
        const total = qtyTotal(item.id);
        if (code && total > 0) lines.push(`${code};${total}`);
      });
    });
    if (lines.length === 0) { alert('Žiadne položky s PORTOS kódom a vyplneným množstvom.'); return; }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `inventura_${new Date().toLocaleDateString('sk-SK').replace(/\./g, '-')}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  // ── ZÁLOHA DÁT — export/import celého foxford-* localStorage ────────────────
  const exportBackup = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('foxford-')) data[k] = localStorage.getItem(k);
    }
    const payload = { _app: 'foxford', _exported: new Date().toISOString(), _branch: branch || '', data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `foxford-zaloha_${(branch || 'pobocka').replace(/\s+/g, '-')}_${localDayKey(new Date())}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const importBackup = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed._app !== 'foxford' || !parsed.data || typeof parsed.data !== 'object') {
          alert('Neplatný súbor zálohy — vyber súbor exportovaný z Foxford appky.');
          return;
        }
        const when = parsed._exported ? new Date(parsed._exported).toLocaleDateString('sk-SK') : 'neznámy dátum';
        if (!window.confirm(`Obnoviť dáta zo zálohy (${parsed._branch || '—'}, ${when})?\n\nAktuálne dáta v appke budú PREPÍSANÉ.`)) return;
        Object.entries(parsed.data).forEach(([k, v]) => {
          if (k.startsWith('foxford-') && typeof v === 'string') localStorage.setItem(k, v);
        });
        window.location.reload();
      } catch (_) {
        alert('Súbor sa nepodarilo načítať — nie je to platný JSON.');
      }
    };
    reader.readAsText(file);
  };

  const doShake = (setter, ref) => {
    setter(true);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ref.current?.focus();
    setTimeout(() => setter(false), 500);
  };

  const needName = () => { if (!controllerName.trim()) { doShake(setShakeName, nameRef); return false; } return true; };

  // ── MULTI-QTY HELPERS ────────────────────────────────────────────────────────
  const [activeInvField, setActiveInvField] = useState(null); // { itemId, rowId, field: 'qty'|'label'|'note' }
  const addQtyRow = (itemId, itemName, unit) => {
    const newId = 'r' + Date.now();
    setInvQty(q => ({ ...q, [itemId]: [...(q[itemId]||[]), { id: newId, label:'', qty:'' }] }));
    // Automaticky otvor numpad pre nový riadok — isNew: pri zrušení sa prázdny riadok odstráni
    setInvNumpad({ itemId, rowId: newId, value: '', unit: unit || '', itemName: itemName || '', isNew: true });
  };
  const removeQtyRow = (itemId, rowId) => setInvQty(q => ({ ...q, [itemId]: (q[itemId]||[]).filter(r => r.id !== rowId) }));
  const updateQtyRow = (itemId, rowId, field, val) => setInvQty(q => ({ ...q, [itemId]: (q[itemId]||[]).map(r => r.id === rowId ? { ...r, [field]: val } : r) }));
  const qtyTotal     = (itemId) => Math.round((invQty[itemId]||[]).reduce((s, r) => s + (parseFloat((r.qty||'').toString().replace(',','.'))||0), 0) * 1000) / 1000;

  // ── NUMPAD HELPERS ───────────────────────────────────────────────────────
  const numpadPress = key => setInvNumpad(prev => {
    if (!prev) return prev;
    let v = prev.value;
    if (key === '⌫') { v = v.slice(0, -1); }
    else if (key === '±') { v = v.startsWith('-') ? v.slice(1) : (v === '' || v === '0' ? '-' : '-' + v); }
    else if (key === '.') { if (!v.includes('.')) v += v === '' ? '0.' : '.'; }
    else if (v === '0') { v = key; }
    else { if (v.replace('-', '').length < 8) v += key; }
    return { ...prev, value: v };
  });
  const numpadConfirm = () => {
    if (!invNumpad) return;
    // Odpisy: numpad zapíše množstvo do dnešného odpisu (itemId = dayKey, rowId = entry id)
    if (invNumpad.kind === 'odpis') {
      const num = parseFloat((invNumpad.value || '').toString().replace(',', '.')) || 0;
      const limit = ODPIS_UNIT_LIMITS[invNumpad.unit];
      // Nad limit jednotky → vyzvi na kontrolu (pravdepodobný omyl kg vs g a pod.)
      if (limit && num > limit) {
        setQtyWarn({ itemId: invNumpad.itemId, rowId: invNumpad.rowId, value: invNumpad.value, unit: invNumpad.unit, itemName: invNumpad.itemName });
        setInvNumpad(null);
        return;
      }
      updateOdpisQty(invNumpad.itemId, invNumpad.rowId, invNumpad.value);
      setInvNumpad(null);
      return;
    }
    // Alkohol: numpad zapíše počet otvorených fliaš (rowId = bottle id)
    if (invNumpad.kind === 'alkohol') {
      setAlkoholCount(invNumpad.rowId, invNumpad.value);
      setInvNumpad(null);
      return;
    }
    // Teploty: numpad zapíše teplotu do aktívnej smeny (tempKey = field.key)
    if (invNumpad.kind === 'temp') {
      const setTempState = haccpShift === 'ranné' ? setTemps : setTempsVecerne;
      const v = invNumpad.value === '-' ? '' : invNumpad.value; // samotné mínus bez čísla = prázdne
      setTempState(prev => ({ ...prev, [invNumpad.tempKey]: v }));
      setInvNumpad(null);
      return;
    }
    // Uzávierka: numpad zapíše sumu do poľa dennej uzávierky (fieldKey = A..L)
    if (invNumpad.kind === 'uzavierka') {
      const v = invNumpad.value === '-' ? '' : invNumpad.value;
      setUzavField(invNumpad.dayKey, invNumpad.fieldKey, v);
      setInvNumpad(null);
      return;
    }
    // Potvrdenie prázdnej hodnoty na čerstvo pridanom riadku = riadok netreba
    if (invNumpad.isNew && !invNumpad.value) {
      removeQtyRow(invNumpad.itemId, invNumpad.rowId);
      setInvNumpad(null);
      return;
    }
    updateQtyRow(invNumpad.itemId, invNumpad.rowId, 'qty', invNumpad.value);
    setInvNumpad(null);
  };
  const numpadCancel = () => {
    if (!invNumpad) return;
    // Zrušenie numpadu pre nový riadok — odstráň prázdny riadok aby nezostal visieť
    if (invNumpad.isNew) removeQtyRow(invNumpad.itemId, invNumpad.rowId);
    setInvNumpad(null);
  };
  const needInsp = () => { if (!inspectors[subTab].trim()) { doShake(setShakeInsp, inspRef); return false; } return true; };

  // ── ODPISY HELPERS ───────────────────────────────────────────────────────
  const ODPISOVY_DOVODY = ['Spotreba', 'Pokazené', 'Rozbité', 'Ochutnávka'];

  // backward compat: starý formát bol pole, nový je { entries, note }
  const getDayData = (key) => { const d = odpisy[key]; if (!d) return { entries: [], note: '' }; if (Array.isArray(d)) return { entries: d, note: '' }; return { entries: d.entries || [], note: d.note || '' }; };
  const setDayNote = (key, note) => setOdpisy(prev => { const d = getDayData(key); return { ...prev, [key]: { entries: d.entries, note } }; });

  const addOdpis = (item) => {
    setOdpisy(prev => {
      const d = getDayData(todayKey);
      return { ...prev, [todayKey]: { entries: [...d.entries, { id: 'o' + Date.now(), itemId: item.id, name: item.name, unit: item.unit, qty: '', reason: 'Spotreba' }], note: d.note } };
    });
    setOdpisySearch('');
  };
  const updateOdpisQty    = (key, id, qty)    => setOdpisy(prev => { const d = getDayData(key); return { ...prev, [key]: { ...d, entries: d.entries.map(e => e.id === id ? { ...e, qty }    : e) } }; });
  const updateOdpisReason = (key, id, reason) => setOdpisy(prev => { const d = getDayData(key); return { ...prev, [key]: { ...d, entries: d.entries.map(e => e.id === id ? { ...e, reason } : e) } }; });
  const removeOdpis       = (key, id)         => setOdpisy(prev => { const d = getDayData(key); return { ...prev, [key]: { ...d, entries: d.entries.filter(e => e.id !== id) } }; });

  const parseQty = (val) => parseFloat((val || '').toString().replace(',', '.')) || 0;

  // ── UZÁVIERKA HELPERS ──────────────────────────────────────────────────────
  const UZAV_DEFAULT = { kasa:'', meno:'', A:'', firstA:'', B:'', C:'', D:'', E:'', sk:'', F:'', G:'', gNote:'', I:'', K:'', L:'', sent:false };
  const num = (x) => parseFloat((x ?? '').toString().replace(',', '.')) || 0;
  const getUzav = (key) => ({ ...UZAV_DEFAULT, ...(uzavierky[key] || {}) });
  // Akákoľvek zmena poľa resetuje "sent" (po úprave treba odoslať znova).
  // Pri poli A navyše zachytíme PRVÉ reálne prerátanie (firstA) — audit, ostane aj keď ho neskôr prepíše.
  const setUzavField = (key, field, value) => setUzavierky(prev => {
    const cur = { ...UZAV_DEFAULT, ...(prev[key] || {}) };
    const next = { ...cur, [field]: value, sent:false };
    if (field === 'A' && (value ?? '').toString().trim() !== '' && (cur.firstA ?? '').toString().trim() === '') {
      next.firstA = value;
    }
    return { ...prev, [key]: next };
  });
  const markUzavSent = (key) => setUzavierky(prev => ({ ...prev, [key]: { ...UZAV_DEFAULT, ...(prev[key] || {}), sent:true } }));

  const parseUzavOcr = (text) => {
    const norm = s => s.toLowerCase()
      .replace(/[áàâ]/g,'a').replace(/[éèê]/g,'e').replace(/[íìî]/g,'i')
      .replace(/[óòô]/g,'o').replace(/[úùû]/g,'u').replace(/[ý]/g,'y')
      .replace(/[ä]/g,'a').replace(/[č]/g,'c').replace(/[ď]/g,'d')
      .replace(/[ě]/g,'e').replace(/[ľĺ]/g,'l').replace(/[ň]/g,'n')
      .replace(/[ŕ]/g,'r').replace(/[š]/g,'s').replace(/[ť]/g,'t')
      .replace(/[žź]/g,'z');
    // Extractuje posledné číslo vo formáte X XXX,XX alebo XXXX,XX alebo XXXX.XX
    // POZOR: nepoužívame [\d\s]* — je too greedy a zje medzeru ktorú OCR vyrobí z čiarky
    const extractNum = line => {
      const s = line.trim();
      // 1. Slovenský formát: čiarka ako decimal, medzera/bodka ako tisíce
      //    Napr: 2254,69 | 2 254,69 | 2.254,69
      const commaAmts = s.match(/\d{1,3}(?:[. ]\d{3})*,\d{2}(?!\d)|\d+,\d{2}(?!\d)/g);
      if (commaAmts) {
        const raw = commaAmts[commaAmts.length - 1];
        return raw.replace(/[. ]/g, '').replace(',', '.');
      }
      // 2. Anglický formát: bodka ako decimal
      const dotAmts = s.match(/\d+\.\d{2}(?!\d)/g);
      if (dotAmts) return dotAmts[dotAmts.length - 1];
      // 3. OCR artefakt — čiarka prečítaná ako medzera: "2254 69" → 2254.69
      //    Pattern: 3+ číslic + medzera + presne 2 číslice (nesledované ďalšou číslicou)
      const ocrFix = s.match(/\d{3,}\s\d{2}(?!\d)/g);
      if (ocrFix) {
        const last = ocrFix[ocrFix.length - 1].split(' ');
        return last[0] + '.' + last[1];
      }
      // 4. Posledné celé číslo ako záloha
      const nums = s.match(/\d+/g);
      return nums ? nums[nums.length - 1] : null;
    };
    const result = {};
    let inObrat = false;
    let inMealCard = false;   // DOXX alebo MOVEUPSK sekcia → sk pole
    let inCelkove = false;    // CELKOVÉ SÚČTY → C pole (terminál)
    text.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
      const n = norm(line);
      const num = extractNum(line);
      // ── Sleduj sekcie ─────────────────────────────────────────────────────
      if (/\bobrat\b/.test(n)) { inObrat = true; inMealCard = false; inCelkove = false; }
      if (/\bplatb/.test(n) || /hotovost/.test(n)) { inObrat = false; }
      if (/\bdoxx\b/.test(n) || /moveupsk|moveup/.test(n) || /noveupsk/.test(n)) {
        inMealCard = true; inCelkove = false;
      }
      if (/celkove sucty/.test(n)) { inCelkove = true; inMealCard = false; }
      if (!num) return;
      // ── PORTOS Denná uzávierka ─────────────────────────────────────────────
      // B · Tržba = SPOLU v sekcii OBRAT (alebo riadok s "trzb")
      if (!result.B && inObrat && /spolu/.test(n)) result.B = num;
      if (!result.B && /trzb/.test(n)) result.B = num;
      // C · Platby kartou (z PORTOS riadku "Kartou")
      if (!result.C && /kartou/.test(n) && !/stravne/.test(n)) result.C = num;
      // D · Qerko
      if (!result.D && /qerko/.test(n) && !/tringelt/.test(n)) result.D = num;
      // E · Qerko tringelt
      if (!result.E && /tringelt/.test(n)) result.E = num;
      // F · Stravné lístky (papierové)
      if (!result.F && /stravne l/.test(n)) result.F = num;
      // L · Zaokrúhlenie
      if (!result.L && /zaokr/.test(n)) result.L = num;
      // ── Platobný terminál (Nets/Nexi výpis) ───────────────────────────────
      // C · Celkové súčty terminála = všetky kartové platby
      if (!result.C && inCelkove && /\bcelkom\b/.test(n)) result.C = num;
      // sk · Z toho stravné karty (DOXX + MOVEUPSK súčet, informatívne)
      if (inMealCard && /\bcelkom\b/.test(n)) {
        const prev = parseFloat(result.sk || '0');
        result.sk = (prev + parseFloat(num)).toFixed(2);
      }
    });
    return result;
  };

  const handleOcrCapture = async (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setOcrImage(blobUrl);
    setOcrRawText('');
    setOcrFilledCount(0);
    setOcrStatus('loading');
    if (ocrInputRef.current) ocrInputRef.current.value = '';
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('slk+eng');
      const { data: { text } } = await worker.recognize(blobUrl);
      await worker.terminate();
      setOcrRawText(text);
      const filled = parseUzavOcr(text);
      const key = localDayKey(new Date());
      let count = 0;
      Object.entries(filled).forEach(([field, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          setUzavField(key, field, val);
          count++;
        }
      });
      setOcrFilledCount(count);
      setOcrStatus('done');
    } catch (err) {
      setOcrStatus('error');
    }
  };

  // H = A+B-C-D-E-F-G (mám mať v kase); M = H-K (nový zostatok); J = H-I (tringelt/manko)
  const uzavH = (d) => num(d.A) + num(d.B) - num(d.C) - num(d.D) - num(d.E) - num(d.F) - num(d.G);
  const uzavM = (d) => uzavH(d) - num(d.K);
  // Carry-over: M poslednej skoršej uzávierky → A nového dňa
  const uzavPrevM = (key) => {
    const prior = Object.keys(uzavierky).filter(k => k < key).sort();
    return prior.length ? uzavM(getUzav(prior[prior.length - 1])) : null;
  };

  // ── ALKOHOL HELPERS ────────────────────────────────────────────────────────
  const alkoholDnes = alkohol[todayKey] || {};
  const setAlkoholCount = (bottleId, count) => setAlkohol(prev => ({ ...prev, [todayKey]: { ...(prev[todayKey] || {}), [bottleId]: count } }));
  const addAlkoholBottle = () => {
    if (!newAlkName.trim()) return;
    setAlkoholKatalog(prev => [...prev, { id: 'a' + Date.now(), name: newAlkName.trim(), type: newAlkType.trim(), ean: newAlkEan.trim() }]);
    setNewAlkName(''); setNewAlkType(''); setNewAlkEan('');
  };
  const removeAlkoholBottle = (id) => setAlkoholKatalog(prev => prev.filter(b => b.id !== id));

  const getMonthSummary = (year, month) => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const map = {};
    Object.entries(odpisy).forEach(([date, day]) => {
      if (!date.startsWith(prefix)) return;
      const entries = Array.isArray(day) ? day : (day.entries || []);
      entries.forEach(e => {
        const num = parseQty(e.qty);
        if (!e.qty || num === 0) return;
        if (!map[e.itemId]) map[e.itemId] = { name: e.name, unit: e.unit, total: 0 };
        map[e.itemId].total = Math.round((map[e.itemId].total + num) * 1000) / 1000;
      });
    });
    return Object.values(map).filter(x => x.total > 0).sort((a, b) => a.name.localeCompare(b.name));
  };

  const exportOdpisyPDF = () => {
    const { year, month } = odpisySummaryDate;
    const summary = getMonthSummary(year, month);
    const mName = MONTHS[month];
    if (summary.length === 0) { alert('Žiadne odpisy pre ' + mName + ' ' + year); return; }
    const rows = summary.map((r, i) => `<tr><td style="color:#a09080;text-align:center">${i + 1}</td><td>${r.name}</td><td style="font-weight:700;text-align:right">${r.total}</td><td style="color:#6b5d4f">${r.unit}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Odpisy ${mName} ${year}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:32px;color:#1e1608;max-width:700px;margin:0 auto}
      h1{font-size:22px;margin-bottom:4px;color:#b87020}
      .meta{font-size:12px;color:#6b5d4f;margin-bottom:28px;border-bottom:1px solid #e8e0d4;padding-bottom:12px}
      table{width:100%;border-collapse:collapse;font-size:14px}
      th{background:#f3e8d0;padding:10px 12px;text-align:left;border-bottom:2px solid #d4a060;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
      td{padding:10px 12px;border-bottom:1px solid #f0ebe3}
      .footer{margin-top:24px;font-size:11px;color:#a09080}
      @media print{body{padding:16px}button{display:none}}
    </style></head><body>
    <h1>Odpisy — ${mName} ${year}</h1>
    <div class="meta">Pobočka: <strong>${branch}</strong> &nbsp;|&nbsp; Zodpovedný: <strong>${odpisyAuthor || 'Neuvedené'}</strong> &nbsp;|&nbsp; Vygenerované: ${new Date().toLocaleDateString('sk-SK', { day:'2-digit', month:'long', year:'numeric' })}</div>
    <table>
      <tr><th>#</th><th>Produkt</th><th style="text-align:right">Množstvo</th><th>Jednotka</th></tr>
      ${rows}
    </table>
    <div style="margin-top:12px;text-align:right;font-size:12px;color:#6b5d4f">Spolu položiek: <strong>${summary.length}</strong></div>
    <div class="footer">Foxford — automaticky vygenerované z aplikácie</div>
    <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
    </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const pct = () => {
    const t = (tasks[subTab] || []).filter(x => !x.header);
    return t.length === 0 ? 0 : Math.round(t.filter(x => x.done).length / t.length * 100);
  };

  const onTouchStart = (e, id) => {
    touchX.current = e.targetTouches[0].clientX;
    touchY.current = e.targetTouches[0].clientY;
    taskTouchMoved.current = false;
  };
  const onTouchMove  = (e) => {
    if (touchX.current === null) return;
    const dx = Math.abs(touchX.current - e.targetTouches[0].clientX);
    const dy = touchY.current !== null ? Math.abs(touchY.current - e.targetTouches[0].clientY) : 0;
    if (dx > 10 || dy > 10) {
      taskTouchMoved.current = true;
      if (timerRef.current) { clearTimeout(timerRef.current); setPressingId(null); }
    }
  };
  const onTouchEnd = () => { touchX.current = null; touchY.current = null; };

  const uncheckedTask = (t) => {
    setTasks({ ...tasks, [subTab]: tasks[subTab].map(x => x.id === t.id ? { ...x, done: false, time: null, issue: null, by: null } : x) });
    setConfirmUndo(null);
  };

  // všetky úlohy (okrem nadpisov sekcií) sú buď splnené alebo majú zaznamenaný problém
  const allResolved = (list) => { const t = list.filter(x => !x.header); return t.length > 0 && t.every(x => x.done || x.issue); };

  const autoSend = (updatedList) => {
    if (subTab === 'denné') return;
    if (!allResolved(updatedList)) return;
    if (!inspectors[subTab].trim()) return;
    sendToSheets('tasks_summary', {
      date: new Date().toLocaleDateString('sk-SK'),
      category: subTab,
      inspector: inspectors[subTab],
      tasks: updatedList.filter(t => !t.header).map(t => ({
        text: t.text,
        done: t.done,
        time: t.time || null,
        date: t.date || null,
        issue: t.issue || null,
        by: t.by || null,
      })),
    });
  };

  const onTaskClick = (t) => {
    if (taskTouchMoved.current) { taskTouchMoved.current = false; return; } // swipe — ignoruj
    if (t.header) return; // nadpis sekcie nie je klikateľný
    if (longPress.current) { longPress.current = false; return; }
    if (!needInsp()) return;
    if (t.done) { setConfirmUndo(t); return; }
    setBouncingCheck(t.id);
    setTimeout(() => setBouncingCheck(null), 500);
    const now = new Date();
    const time = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' });
    const by = inspectors[subTab].trim(); // kto úlohu splnil
    const updated = tasks[subTab].map(x => x.id === t.id ? { ...x, done: true, time, date, by, issue: null } : x);
    setTasks({ ...tasks, [subTab]: updated });
    autoSend(updated);
    if (allResolved(updated)) setTimeout(() => setCelebrate(true), 300);
  };

  const longStart = (t, e) => {
    longPress.current = false;
    if (e) {
      const pt = e.touches?.[0] || e;
      if (pt.clientX != null) setPressPos({ x: pt.clientX, y: pt.clientY });
    }
    setPressingId(t.id);
    timerRef.current = setTimeout(() => {
      longPress.current = true; setQuickTask(t);
      setPressingId(null);
    }, 600);
  };
  const longEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPressingId(null);
  };

  const reportIssue = (reason, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!needInsp()) { setQuickTask(null); return; }
    const by = inspectors[subTab].trim(); // kto problém nahlásil
    const updated = tasks[subTab].map(x => x.id === quickTask.id ? { ...x, done: false, time: null, issue: reason, by } : x);
    setTasks({ ...tasks, [subTab]: updated });
    autoSend(updated);
    if (allResolved(updated)) setTimeout(() => setCelebrate(true), 300);
    setQuickTask(null);
  };

  const resetList = () => setConfirmReset(true);

  const doReset = () => {
    if (!inspectors[subTab].trim()) { doShake(setShakeInsp, inspRef); setConfirmReset(false); return; }
    const taskList = (tasks[subTab] || []).filter(t => !t.header);
    if (taskList.length > 0) {
      sendToSheets('tasks_summary', {
        date: new Date().toLocaleDateString('sk-SK'),
        category: subTab,
        inspector: inspectors[subTab],
        tasks: taskList.map(t => ({ text: t.text, done: t.done, time: t.time || null, date: t.date || null, issue: t.issue || null, by: t.by || null })),
      });
    }
    setTasks({ ...tasks, [subTab]: tasks[subTab].map(t => t.header ? t : ({ ...t, done: false, time: null, issue: null, by: null })) });
    setInspectors(prev => ({ ...prev, [subTab]: '' }));
    setConfirmReset(false);
  };

  const tempColor = (field, val) => {
    const n = parseFloat((val || '').replace(',', '.'));
    if (isNaN(n) || val === '') return null;
    // Ponechaj znamienko mínus — mrazničky majú záporný limit (≤ -18 °C).
    // „≤ X" znamená: hodnota musí byť ≤ X (platí pre chladničky aj mrazničky), inak chyba.
    const maxNum = parseFloat((field.max || '').replace(/[^\d.-]/g, ''));
    if (isNaN(maxNum)) return 'ok';
    return n > maxNum ? 'err' : 'ok';
  };

  // ── TEPLOTY — editácia názvu a max teploty zariadenia ──────────────────────
  const updateTempLabel = (key, label) => setTempFields(prev => prev.map(f => f.key === key ? { ...f, label } : f));
  const updateTempMax   = (key, numStr) => setTempFields(prev => prev.map(f => f.key === key ? { ...f, max: numStr.trim() ? `≤ ${numStr.trim()} °C` : '' } : f));

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: C.bg, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system,sans-serif', position: 'relative', overflow: 'hidden' }}>
        <style>{`
          @keyframes spin   { to { transform: rotate(360deg); } }
          @keyframes glow   { 0%,100% { opacity:.4; transform:scale(1); } 50% { opacity:.9; transform:scale(1.06); } }
          @keyframes rise   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
          @keyframes shake  { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
          .shake { animation: shake .4s ease-in-out; border-color: ${C.err} !important; }
        `}</style>
        {/* ambient glow */}
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:`radial-gradient(circle, rgba(224,160,58,.12) 0%, transparent 70%)`, pointerEvents:'none' }} />
        <div style={{ animation:'glow 2.4s ease-in-out infinite' }}><Logo size={80} /></div>
        <div style={{ marginTop:22, fontSize:24, fontWeight:900, letterSpacing:5, color:C.text, animation:'rise .6s .2s both' }}>FOXFORD</div>
        <div style={{ marginTop:4, fontSize:9, color:C.gold, letterSpacing:3, fontWeight:700, textTransform:'uppercase', opacity:.8, animation:'rise .6s .35s both' }}>Akadémia kontrológie</div>
        <div style={{ marginTop:40, width:26, height:26, border:`2.5px solid rgba(150,120,80,0.25)`, borderTopColor:C.gold, borderRadius:'50%', animation:'spin .7s linear infinite' }} />
      </div>
    );
  }

  // ── BRANCH SELECTION ──────────────────────────────────────────────────────
  if (!branch) {
    return (
      <div style={{ maxWidth:500, margin:'0 auto', minHeight:'100vh', fontFamily:'-apple-system,sans-serif', color:C.text, background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px' }}>
        <Logo size={64} />
        <div style={{ marginTop:20, fontSize:22, fontWeight:900, letterSpacing:3 }}>FOXFORD</div>
        <div style={{ fontSize:9, color:C.gold, letterSpacing:2.5, fontWeight:700, textTransform:'uppercase', marginTop:2, marginBottom:32, opacity:.75 }}>Vyber prevádzku</div>
        {BRANCHES.map(b => (
          <button key={b.name} onClick={() => { localStorage.setItem('foxford-branch', b.name); setBranch(b.name); }}
            style={{ width:'100%', padding:'16px', marginBottom:10, borderRadius:14, border:`1px solid ${C.border}`, background:C.panel, color:C.text, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
            🏪 {b.name}
          </button>
        ))}
      </div>
    );
  }

  // ── MAIN ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: isDesktop ? 1100 : isTablet ? 860 : 500, margin:'0 auto', minHeight:'100vh', fontFamily:'-apple-system,sans-serif', color:C.text, paddingBottom: isTablet ? 120 : 110, overflowX:'hidden', background: C.bg, position:'relative' }}>
      <div className="bg-parallax" />
      <style>{`.shake{animation:shake .4s ease-in-out;border-color:${C.err}!important;} @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}`}</style>

      {/* HEADER */}
      <header style={{
        padding: isTablet ? '18px 36px 14px' : '18px 20px 14px', display:'flex', alignItems:'center',
        position:'sticky', top:0, zIndex:50,
        background:'rgba(242,237,228,0.93)',
        backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
        boxShadow:'0 1px 0 rgba(150,120,80,0.13)',
      }}>
        <div style={{ flex:1, display:'flex', justifyContent:'flex-start', alignItems:'center', gap:8 }}>
          {/* Bug report button */}
          <div onClick={() => { setShowBugModal(true); setBugSent(false); setBugText(''); }}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', cursor:'pointer', opacity:.55, transition:'opacity .15s' }}
            title="Nahlásiť chybu">
            <span style={{ fontSize: isTablet ? 20 : 17 }}>🐛</span>
            <span style={{ fontSize:7, color:C.sub, fontWeight:700, letterSpacing:.3, marginTop:1, lineHeight:1 }}>CHYBA</span>
          </div>
          {!online && (
            <div className="dot-pulse-red" style={{ fontSize:9, fontWeight:800, color:C.err, border:`1px solid ${C.err}`, padding:'3px 9px', borderRadius:20, letterSpacing:.5 }}>
              OFFLINE{offlineQueue.length > 0 ? ` (${offlineQueue.length})` : ''}
            </div>
          )}
          {online && offlineFlushed > 0 && (
            <div style={{ fontSize:9, fontWeight:800, color:C.ok, border:`1px solid ${C.ok}`, padding:'3px 9px', borderRadius:20, letterSpacing:.5 }}>
              ✓ {offlineFlushed} odoslaných
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:3, marginLeft:2 }}>
            <button onClick={() => setUiZoom(z => Math.max(0.8, +((z - 0.1).toFixed(1))))}
              style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:6, color:C.sub,
                       fontSize:10, fontWeight:800, cursor:'pointer', padding:'2px 5px', lineHeight:1.4,
                       fontFamily:'inherit', userSelect:'none' }}>A−</button>
            <button onClick={() => setUiZoom(z => Math.min(1.5, +((z + 0.1).toFixed(1))))}
              style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:6, color:C.sub,
                       fontSize:10, fontWeight:800, cursor:'pointer', padding:'2px 5px', lineHeight:1.4,
                       fontFamily:'inherit', userSelect:'none' }}>A+</button>
          </div>
        </div>
        <img src={`${process.env.PUBLIC_URL}/foxford-logo.png.png`} alt="Foxford" style={{ height:44, objectFit:'contain' }} />
        <div style={{ flex:1, display:'flex', justifyContent:'flex-end', alignItems:'center', gap:14 }}>
          {/* Bell notification icon */}
          <div onClick={() => setShowNotifModal(true)} style={{ cursor:'pointer', position:'relative', display:'flex', flexDirection:'column', alignItems:'center', opacity: notifSettings.enabled && notifPermission === 'granted' ? 0.85 : 0.45 }}>
            <span style={{ fontSize:18 }}>🔔</span>
            {notifSettings.enabled && notifPermission === 'granted' && (
              <div style={{ position:'absolute', top:-2, right:-3, width:7, height:7, borderRadius:'50%', background:C.ok, boxShadow:`0 0 5px ${C.ok}` }} />
            )}
          </div>
          <div onClick={() => { setPinInput(''); setPinError(false); setPinStep(true); }}
            style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', cursor:'pointer', opacity:.6 }}>
            <span style={{ fontSize:16 }}>🏪</span>
            <span style={{ fontSize:8, color:C.gold, fontWeight:700, letterSpacing:.5, maxWidth:80, textAlign:'right', lineHeight:1.2, marginTop:1 }}>{branch}</span>
          </div>
        </div>
      </header>

      {/* thin gold rule */}
      <div style={{ height:1, background:`linear-gradient(to right, transparent, ${C.goldLine}, transparent)`, margin: isTablet ? '0 36px 12px' : '0 20px 12px' }} />

      {/* ── DATETIME BAR ────────────────────────────────────────────────────── */}
      <div style={{ margin: isTablet ? '0 24px 8px' : '0 14px 8px', display:'flex', justifyContent:'space-between', alignItems:'center', padding: isTablet ? '10px 22px' : '8px 16px', borderRadius:12, background:C.panel, border:`1px solid ${C.border}` }}>
        <span style={{ fontSize: isTablet ? 14 : 12, fontWeight:600, color:C.sub }}>
          {now.toLocaleDateString('sk-SK', { weekday:'long', day:'numeric', month:'long' })}
        </span>
        <span style={{ fontSize: isTablet ? 18 : 16, fontWeight:800, color:C.gold, letterSpacing:1, fontVariantNumeric:'tabular-nums' }}>
          {now.toLocaleTimeString('sk-SK', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
        </span>
      </div>

<div style={{ padding: isTablet ? '0 24px' : '0 14px' }}>

        {/* ── TASKS ────────────────────────────────────────────────────────── */}
        {tab === 'tasks' && (
          <>
            {/* Sub-tab switcher — full width */}
            <div style={{ display:'flex', gap:6, marginBottom:10 }}>
              {['denné','víkendové','mesačné'].map(id => (
                <button key={id} onClick={() => setSubTab(id)} style={{
                  flex:1, padding: isTablet ? '11px 4px' : '9px 4px', borderRadius:12, border:`1px solid ${subTab===id ? C.goldLine : C.border}`,
                  background: subTab===id ? C.goldDim : 'transparent',
                  color: subTab===id ? C.gold : C.sub,
                  fontWeight:700, fontSize: isTablet ? 11 : 9, letterSpacing:.8, textTransform:'uppercase',
                  cursor:'pointer', fontFamily:'inherit',
                }}>{id}</button>
              ))}
            </div>

            {/* Top row: inspector + progress side-by-side on tablet */}
            <div style={{ display: isTablet ? 'grid' : 'block', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'start', marginBottom: isTablet ? 0 : 0 }}>
            {/* Inspector */}
            <Glass accent style={{ padding:'14px 16px' }}>
              <Tag text={`Kontroluje — ${subTab}`} />
              <Inp ref={inspRef} type="text" placeholder="Tvoje meno…"
                value={inspectors[subTab]}
                onChange={e => { const v = e.target.value; setInspectors(prev => ({ ...prev, [subTab]: v })); }}
                shake={shakeInsp}
                style={{ marginTop:7, borderColor: inspectors[subTab] ? C.ok : C.err + '88' }} />
            </Glass>

            {/* Progress */}
            <Glass style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <Tag text="Postup" />
                <span style={{ fontSize:13, fontWeight:800, color: pct()===100 ? C.ok : C.gold }}>
                  {(tasks[subTab]||[]).filter(t=>t.done).length} / {(tasks[subTab]||[]).filter(t=>!t.header).length}
                </span>
              </div>
              <div style={{ height:7, background:C.muted, borderRadius:4, overflow:'hidden' }}>
                <div className="progress-fill" style={{ height:'100%', width:`${pct()}%`, background: pct()===100 ? C.ok : C.gold, borderRadius:4, boxShadow: pct()>0 ? `0 0 10px ${pct()===100 ? C.ok : C.gold}` : 'none' }} />
              </div>
            </Glass>
            </div>

            {/* Task list */}
            <Glass style={{ padding:'10px 10px' }}>
              {/* Add — len v editMode (pridávanie aj mazanie sú pod jedným prepínačom) */}
              {editMode && (
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <Inp value={newTask} onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter'&&newTask.trim()){setTasks({...tasks,[subTab]:[...(tasks[subTab]||[]),{id:Date.now(),text:newTask,done:false,time:null,issue:null}]});setNewTask('');} }}
                  placeholder="Pridať úlohu…"
                  style={{ flex:1, fontSize:14, padding:'10px 12px' }} />
                <button onClick={() => { if(newTask.trim()){setTasks({...tasks,[subTab]:[...(tasks[subTab]||[]),{id:Date.now(),text:newTask,done:false,time:null,issue:null}]});setNewTask('');} }}
                  style={{ width:42, borderRadius:12, border:`1px solid ${C.border}`, background:C.panelHov, color:C.gold, fontSize:22, fontWeight:300, cursor:'pointer' }}>+</button>
              </div>
              )}

              {/* Tasks — pri sekciách (nadpisoch) zachovaj poradie; inak urgentné hore, splnené dole */}
              {(() => {
                const list = tasks[subTab] || [];
                const hasSections = list.some(t => t.header);
                return hasSections ? list : [...list].sort((a,b) => {
                  if (a.done !== b.done) return a.done ? 1 : -1;
                  if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
                  return 0;
                });
              })().map(t => t.header ? (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'14px 4px 6px', marginTop:2 }}>
                  <div style={{ width:3, height:14, borderRadius:2, background:C.gold, flexShrink:0 }} />
                  <span style={{ fontSize:12, fontWeight:800, color:C.gold, letterSpacing:.8, textTransform:'uppercase' }}>{t.text}</span>
                  {editMode && (
                    <span onClick={e => { e.stopPropagation(); setConfirmDeleteTask(t); }}
                      style={{ marginLeft:'auto', color:C.err, fontSize:11, fontWeight:700, cursor:'pointer', padding:'3px 8px', borderRadius:8, background:C.errDim, border:`1px solid ${C.err}33` }}>✕</span>
                  )}
                </div>
              ) : (
                <div key={t.id} style={{ position:'relative', borderRadius:12, marginBottom:5 }}>
                  <div
                    onMouseDown={e => longStart(t, e)} onMouseUp={longEnd}
                    onTouchStart={e => { longStart(t, e); onTouchStart(e,t.id); }}
                    onTouchMove={onTouchMove}
                    onTouchEnd={() => { longEnd(); onTouchEnd(); }}
                    onContextMenu={e => e.preventDefault()}
                    onClick={() => onTaskClick(t)}
                    style={{
                      position:'relative', zIndex:2,
                      display:'flex', alignItems:'center', gap:12, padding:'13px 12px',
                      background: t.done ? C.okDim : t.issue ? C.errDim : t.urgent ? 'rgba(232,114,114,0.07)' : C.panelHov,
                      borderRadius:12,
                      userSelect:'none', WebkitUserSelect:'none',
                      border:`1px solid ${t.done ? C.ok+'44' : t.issue ? C.err+'44' : t.urgent ? C.err+'55' : C.border}`,
                      cursor:'pointer',
                    }}>
                    {/* Circle checkbox */}
                    <div className={bouncingCheck === t.id ? 'checkbox-spring' : ''} style={{
                      width:22, height:22, borderRadius:'50%', flexShrink:0,
                      border:`2px solid ${t.done ? C.ok : t.issue ? C.err : C.muted}`,
                      background: t.done ? C.ok : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow: t.done ? `0 0 8px ${C.ok}66` : 'none',
                    }}>
                      {t.done && <span style={{ color:'#0d0a07', fontSize:12, fontWeight:900, lineHeight:1 }}>✓</span>}
                      {!t.done && t.issue && <span style={{ color:C.err, fontSize:12, fontWeight:900, lineHeight:1 }}>!</span>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom: t.issue ? 2 : 0 }}>
                        {t.urgent && !t.done && <span style={{ fontSize:9, fontWeight:800, color:C.err, border:`1px solid ${C.err}55`, padding:'1px 5px', borderRadius:5, letterSpacing:.5, flexShrink:0 }}>URGENTNÉ</span>}
                        <div style={{ fontSize:14, fontWeight:500, color: t.done ? C.sub : C.text, textDecoration: t.done ? 'line-through' : 'none', lineHeight:1.4, wordBreak:'break-word' }}>{t.text}</div>
                      </div>
                      {t.issue && <div style={{ fontSize:11, color:C.err, fontWeight:600 }}>⚠ {t.issue}{t.by ? <span style={{ color:C.muted, fontWeight:500 }}> · {t.by}</span> : null}</div>}
                    </div>
                    {t.done && !editMode && (
                      <span style={{ fontSize:11, fontWeight:700, color:C.ok, flexShrink:0, textAlign:'right', lineHeight:1.45, maxWidth:110 }}>
                        {t.by && <span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.by}</span>}
                        <span style={{ fontSize:10, fontWeight:600, color:C.ok+'99' }}>{t.time}{t.date ? ` · ${t.date}` : ''}</span>
                      </span>
                    )}
                    {/* Editácia: ✕ na zmazanie úlohy */}
                    {editMode && (
                      <span
                        onClick={e => { e.stopPropagation(); setConfirmDeleteTask(t); }}
                        onMouseDown={e => e.stopPropagation()}
                        onTouchStart={e => e.stopPropagation()}
                        style={{ display:'inline-flex', alignItems:'center', gap:5, color:C.err, fontSize:11, fontWeight:700, cursor:'pointer', lineHeight:1, flexShrink:0,
                                 padding:'5px 9px', borderRadius:8, background:C.errDim, border:`1px solid ${C.err}33` }}>
                        ✕ Zmazať
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {(tasks[subTab]||[]).length === 0 && (
                <div style={{ textAlign:'center', color:C.muted, fontSize:13, padding:'24px 0' }}>Žiadne úlohy</div>
              )}
            </Glass>

            <button onClick={resetList} style={{ display:'block', width:'100%', padding:'10px', background:'none', border:'none', color:C.err+'99', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Resetovať zoznam
            </button>

            {/* Editačný prepínač — odomkne pridávanie aj mazanie úloh */}
            <div onClick={() => setConfirmEditMode(true)}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginTop:6,
                       padding:'12px', borderRadius:14, cursor:'pointer', userSelect:'none',
                       border:`1px solid ${editMode ? C.goldLine : C.border}`,
                       background: editMode ? C.goldDim : 'transparent' }}>
              <span style={{ fontSize:13, fontWeight:700, letterSpacing:.5, color: editMode ? C.gold : C.muted }}>
                {editMode ? '🔓 Editácia zapnutá' : '🔒 Editácia (pridať / mazať úlohy)'}
              </span>
              <div style={{ width:38, height:22, borderRadius:11, padding:2, transition:'background .2s',
                            background: editMode ? C.gold : 'rgba(150,120,80,0.25)', flexShrink:0 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', transition:'transform .2s',
                              transform: editMode ? 'translateX(16px)' : 'translateX(0)',
                              boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
              </div>
            </div>
          </>
        )}

        {/* ── TEMPS ────────────────────────────────────────────────────────── */}
        {tab === 'temps' && (() => {
          const activeTemps    = haccpShift === 'ranné' ? temps    : tempsVecerne;
          const activeDone     = haccpShift === 'ranné' ? lastHaccpDate === new Date().toDateString() : lastHaccpDateVecerne === new Date().toDateString();
          // Vlastné odoslanie HACCP kontroly (volané po validácii alebo z "Odoslať aj tak")
          const submitHaccp = () => {
            setSending(true);
            sendToSheets('haccp', {
              date: new Date().toLocaleDateString('sk-SK'),
              shift: haccpShift,
              podpis: controllerName || 'Anonym',
              readings: tempFields.map(f => ({ label: f.label, value: activeTemps[f.key] || '', max: f.max })),
            });
            setTimeout(() => {
              setSending(false);
              const today = new Date().toDateString();
              if (haccpShift === 'ranné') {
                setLastHaccpDate(today);
                localStorage.setItem('foxford-haccp-date', today);
              } else {
                setLastHaccpDateVecerne(today);
                localStorage.setItem('foxford-haccp-date-vecerne', today);
              }
              setCelebrateHaccp(true);
            }, 900);
          };
          return (
          <>
            <Glass accent style={{ padding:'14px 16px' }}>
              <Tag text="Tvoje meno" />
              <Inp ref={nameRef} type="text" placeholder="Zadaj meno…" value={controllerName}
                onChange={e => setControllerName(e.target.value)} shake={shakeName}
                style={{ marginTop:7, borderColor: controllerName ? C.ok : C.border }} />
            </Glass>

            {/* Prepínač zmeny */}
            <div style={{ display:'flex', gap:8, padding:'0 2px' }}>
              {['ranné', 'večerné'].map(shift => {
                const shiftDone = shift === 'ranné' ? lastHaccpDate === new Date().toDateString() : lastHaccpDateVecerne === new Date().toDateString();
                const isActive  = haccpShift === shift;
                return (
                  <button key={shift} onClick={() => setHaccpShift(shift)} style={{
                    flex:1, padding:'11px 0', borderRadius:14, border:`1.5px solid ${isActive ? C.gold : C.border}`,
                    background: isActive ? C.goldDim : 'rgba(255,255,255,0.7)',
                    color: isActive ? C.gold : C.sub, fontWeight:700, fontSize:13,
                    cursor:'pointer', fontFamily:'inherit', letterSpacing:.5,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  }}>
                    <span>{shift === 'ranné' ? '🌅' : '🌙'}</span>
                    <span style={{ textTransform:'capitalize' }}>{shift}</span>
                    {shiftDone && <span style={{ fontSize:11, color:C.ok }}>✓</span>}
                  </button>
                );
              })}
            </div>

            <Glass style={{ padding:'14px 16px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <span style={{ fontSize:12, fontWeight:700, letterSpacing:1, color:C.sub, textTransform:'uppercase' }}>HACCP — {haccpShift === 'ranné' ? 'Ranná' : 'Večerná'} kontrola</span>
                {editMode && (
                  <div onClick={() => { if (showAddTemp) { setShowAddTemp(false); setNewTempLabel(''); setNewTempMax(''); } else { setConfirmAddTemp(true); } }}
                    style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                    {showAddTemp && <span style={{ fontSize:11, fontWeight:600, color:C.muted }}>Zrušiť</span>}
                    <span style={{ width:22, height:22, borderRadius:6, border:`1px solid ${showAddTemp ? C.goldLine : C.border}`, background: showAddTemp ? C.goldDim : 'transparent', color: showAddTemp ? C.gold : C.muted, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:300, lineHeight:1 }}>
                      {showAddTemp ? '✕' : '+'}
                    </span>
                  </div>
                )}
              </div>

              {/* Pridať zariadenie */}
              {editMode && showAddTemp && <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                <Inp placeholder="Názov zariadenia…" value={newTempLabel} onChange={e => setNewTempLabel(e.target.value)}
                  style={{ flex:2, padding:'9px 12px', fontSize:13 }} />
                <Inp placeholder="Max (napr. ≤ 5 °C)" value={newTempMax} onChange={e => setNewTempMax(e.target.value)}
                  style={{ flex:1, padding:'9px 12px', fontSize:13 }} />
                <button onClick={() => {
                  if (!newTempLabel.trim()) return;
                  const key = 'temp_' + Date.now();
                  const rawMax = newTempMax.trim();
                  const formattedMax = rawMax
                    ? /^[\d.,]+$/.test(rawMax) ? `≤ ${rawMax} °C` : rawMax
                    : '';
                  setTempFields(prev => [{ key, label: newTempLabel.trim(), max: formattedMax }, ...prev]);
                  setTemps(prev => ({ ...prev, [key]: '' }));
                  setTempsVecerne(prev => ({ ...prev, [key]: '' }));
                  setNewTempLabel(''); setNewTempMax(''); setShowAddTemp(false);
                }} style={{ padding:'9px 16px', borderRadius:12, border:`1px solid ${C.goldLine}`, background:C.goldDim, color:C.gold, fontWeight:700, fontSize:13, cursor:'pointer', flexShrink:0, letterSpacing:.5 }}>Pridať</button>
              </div>}

              <div style={{ display: isTablet ? 'grid' : 'block', gridTemplateColumns: isDesktop ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10 }}>
              {tempFields.map((field) => {
                // ── Editačný režim: úprava názvu + max teploty ──
                if (editMode) {
                  const maxNum = (field.max || '').replace(/[^\d.,]/g, '');
                  return (
                    <div key={field.key} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, padding:'10px', borderRadius:12, background:'rgba(150,120,80,0.06)', border:`1px solid ${C.border}` }}>
                      <Inp value={field.label} onChange={e => updateTempLabel(field.key, e.target.value)} placeholder="Názov zariadenia"
                        style={{ flex:2, fontSize:13, padding:'9px 10px' }} />
                      <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                        <span style={{ fontSize:13, color:C.sub, fontWeight:700 }}>≤</span>
                        <Inp value={maxNum} onChange={e => updateTempMax(field.key, e.target.value)} placeholder="5" inputMode="decimal"
                          style={{ width:50, fontSize:13, padding:'9px 4px', textAlign:'center' }} />
                        <span style={{ fontSize:13, color:C.sub }}>°C</span>
                      </div>
                      <span onClick={() => setConfirmRemoveTemp(field)}
                        style={{ color:C.err, fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0, padding:'6px 9px', borderRadius:8, background:C.errDim, border:`1px solid ${C.err}33` }}>✕</span>
                    </div>
                  );
                }
                const val = activeTemps[field.key] || '';
                const status = tempColor(field, val);
                const accentColor = status === 'ok' ? C.ok : status === 'err' ? C.err : C.border;
                const fillPct = (() => {
                  if (!status) return 0;
                  if (status === 'err') return 100;
                  const v = parseFloat((val || '').replace(',','.'));
                  const m = parseFloat((field.max || '').replace(/[^\d.]/g, ''));
                  if (isNaN(v) || isNaN(m) || m <= 0) return 55;
                  return Math.max(10, Math.min(85, (Math.abs(v) / m) * 65));
                })();
                const thermoColor = status === 'ok' ? C.ok : status === 'err' ? C.err : C.muted;
                return (
                  <div key={field.key} style={{ display:'flex', alignItems:'center', gap:10, marginBottom: isTablet ? 0 : 10 }}>
                    <div className="thermo" title={`${val || '—'} ${field.max || ''}`}>
                      <div className="thermo-fill" style={{ height: `${fillPct}%`, background: `linear-gradient(180deg, ${thermoColor}, ${thermoColor}cc)`, '--fill': `${fillPct}%` }} />
                      <div className="thermo-bulb" style={{ background: thermoColor, boxShadow: status ? `0 0 6px ${thermoColor}88` : 'none' }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                        <span style={{ fontSize:11, fontWeight:700, letterSpacing:.5, color: status ? accentColor : C.sub, textTransform:'uppercase' }}>{field.label}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          {field.max && <span style={{ fontSize:10, color:C.muted }}>{field.max}</span>}
                        </div>
                      </div>
                      <div style={{ position:'relative' }}>
                        {activeDone ? (
                          /* Uzamknutý stav — namiesto inputu obyčajný div (žiadny scroll/keyboard/focus) */
                          <div role="button" tabIndex={-1}
                            onPointerDown={e => { e.preventDefault(); e.stopPropagation(); setLockedAlert({ shift: haccpShift }); }}
                            style={{
                              width:'100%', padding:'10px 14px', borderRadius:12,
                              border:`1.5px solid ${accentColor}`,
                              background: status === 'ok' ? C.okDim : status === 'err' ? C.errDim : C.panel,
                              color: status ? accentColor : C.text,
                              fontSize:18, fontWeight:800, textAlign:'center', letterSpacing:1,
                              boxSizing:'border-box', fontFamily:'inherit',
                              boxShadow: status ? `0 0 10px ${accentColor}22` : 'none',
                              cursor:'pointer',
                              userSelect:'none', WebkitUserSelect:'none',
                              WebkitTapHighlightColor:'transparent',
                              minHeight: 22,
                            }}>
                            {val || '—'}
                          </div>
                        ) : (
                          <div role="button" tabIndex={-1}
                            onPointerDown={e => { tapStartRef.current = { x: e.clientX, y: e.clientY }; }}
                            onPointerUp={e => { if (Math.abs(e.clientX - tapStartRef.current.x) + Math.abs(e.clientY - tapStartRef.current.y) < 10) { e.stopPropagation(); setInvNumpad({ kind:'temp', tempKey: field.key, value: (val || '').toString(), unit:'°C', itemName: field.label }); } }}
                            style={{
                              width:'100%', padding:'10px 14px', borderRadius:12,
                              border:`1.5px solid ${accentColor}`,
                              background: status === 'ok' ? C.okDim : status === 'err' ? C.errDim : C.panel,
                              color: status ? accentColor : (val ? C.text : C.muted),
                              fontSize:18, fontWeight:800, textAlign:'center', letterSpacing:1,
                              boxSizing:'border-box', fontFamily:'inherit',
                              boxShadow: status ? `0 0 10px ${accentColor}22` : 'none',
                              touchAction:'manipulation', cursor:'pointer', userSelect:'none', WebkitUserSelect:'none',
                              WebkitTapHighlightColor:'transparent', minHeight: 22,
                            }}>
                            {val || '0.0'}
                          </div>
                        )}
                        {status && (
                          <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:14, pointerEvents:'none' }}>
                            {status === 'ok' ? '✓' : '⚠'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>

              {editMode ? null : activeDone ? (
                <div style={{ textAlign:'center', padding:'12px 0 4px', color:C.ok, fontSize:13, fontWeight:600 }}>
                  ✓ {haccpShift === 'ranné' ? 'Ranná' : 'Večerná'} kontrola zaznamenaná
                  <div style={{ fontSize:11, color:C.muted, marginTop:4, fontWeight:400 }}>🌙 Polia sa odomknú automaticky o polnoci</div>
                  <button onClick={() => setConfirmResetHaccp(true)} style={{ marginTop:12, background:'none', border:'none', color:C.muted, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textDecoration:'underline' }}>
                    Resetovať teraz
                  </button>
                </div>
              ) : (() => {
                // Varovanie: rozpísané teploty, ktoré ešte neboli odoslané (o polnoci by sa stratili)
                const anyTempFilled = tempFields.some(f => (activeTemps[f.key] || '').toString().trim());
                return (
                <>
                  {anyTempFilled && (
                    <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:10, padding:'10px 12px',
                                  borderRadius:12, background:C.errDim, border:`1px solid ${hexToRgba(C.err, 0.3)}` }}>
                      <span style={{ fontSize:16, lineHeight:1.2 }}>⚠️</span>
                      <span style={{ fontSize:12, color:C.err, fontWeight:600, lineHeight:1.45 }}>
                        Máš rozpísané teploty, ktoré ešte <b>nie sú odoslané</b>. Bez stlačenia „Odoslať“ sa o polnoci stratia.
                      </span>
                    </div>
                  )}
                  <button disabled={sending} onClick={() => {
                    if (!needName()) return;
                    // Validácia — všetky teploty musia byť vyplnené
                    const missing = tempFields.filter(f => !(activeTemps[f.key] || '').toString().trim());
                    if (missing.length > 0) { setHaccpMissing(missing.map(f => f.label)); return; }
                    submitHaccp();
                  }} style={{
                    width:'100%', padding:'13px', marginTop:2,
                    background: C.gold, border:'none',
                    color:'#fff', borderRadius:14, fontWeight:800, fontSize:14,
                    letterSpacing:.8, cursor:'pointer', fontFamily:'inherit',
                    opacity: sending ? .7 : 1,
                    boxShadow:`0 4px 18px rgba(184,112,32,0.35)`,
                  }}>
                    {sending ? 'Odosielam…' : `Odoslať ${haccpShift === 'ranné' ? 'rannú' : 'večernú'} kontrolu`}
                  </button>
                </>
                );
              })()}
            </Glass>

            {editMode && (
              <div style={{ fontSize:11, color:C.muted, textAlign:'center', margin:'2px 0 8px', lineHeight:1.5 }}>
                Uprav názvy zariadení a max teploty. Zmeny platia pre rannú aj večernú kontrolu.
              </div>
            )}

            {/* Editačný prepínač — odomkne úpravu zariadení a teplôt */}
            <div onClick={() => setConfirmEditMode(true)}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginTop:6,
                       padding:'12px', borderRadius:14, cursor:'pointer', userSelect:'none',
                       border:`1px solid ${editMode ? C.goldLine : C.border}`,
                       background: editMode ? C.goldDim : 'transparent' }}>
              <span style={{ fontSize:13, fontWeight:700, letterSpacing:.5, color: editMode ? C.gold : C.muted }}>
                {editMode ? '🔓 Editácia zapnutá' : '🔒 Editácia (zariadenia a teploty)'}
              </span>
              <div style={{ width:38, height:22, borderRadius:11, padding:2, transition:'background .2s',
                            background: editMode ? C.gold : 'rgba(150,120,80,0.25)', flexShrink:0 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', transition:'transform .2s',
                              transform: editMode ? 'translateX(16px)' : 'translateX(0)',
                              boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
              </div>
            </div>

            {/* ── UPOZORNENIE — nevyplnené teploty pri odoslaní ── */}
            {haccpMissing && (
              <div onPointerDown={() => setHaccpMissing(null)}
                style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
                         display:'flex', alignItems:'center', justifyContent:'center', zIndex:3600, padding:24 }}>
                <div onPointerDown={e => e.stopPropagation()} className="sheet-bounce"
                  style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', maxWidth:360, borderRadius:24, padding:'28px 22px 22px', boxShadow:'0 12px 48px rgba(0,0,0,.18)' }}>
                  <div style={{ fontSize:40, textAlign:'center', marginBottom:12 }}>🌡️</div>
                  <div style={{ fontSize:17, fontWeight:800, color:C.text, textAlign:'center', marginBottom:10 }}>
                    Nevyplnené teploty
                  </div>
                  <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:14, lineHeight:1.6 }}>
                    Tieto zariadenia nemajú zadanú teplotu:
                  </div>
                  <div style={{ maxHeight:150, overflowY:'auto', marginBottom:20 }}>
                    {haccpMissing.map((label, i) => (
                      <div key={i} style={{ fontSize:13, color:C.err, fontWeight:600, padding:'5px 0', borderBottom:`1px solid ${C.border}`, textAlign:'center' }}>• {label}</div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button onPointerDown={e => { e.preventDefault(); setHaccpMissing(null); }}
                      style={{ flex:2, padding:'13px', borderRadius:14, border:`1px solid ${C.goldLine}`, background:C.goldDim, color:C.gold, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                      Doplniť teploty
                    </button>
                    <button onPointerDown={e => { e.preventDefault(); setHaccpMissing(null); submitHaccp(); }}
                      style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                      Odoslať aj tak
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
          );
        })()}

        {/* ── INVENTORY ────────────────────────────────────────────────────── */}
        {tab === 'inventory' && (
          <div onPointerDown={e => { if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } }}>
            <Glass accent style={{ padding:'14px 16px' }}>
              <Tag text="Tvoje meno" />
              <Inp ref={nameRef} type="text" placeholder="Zadaj meno…" value={controllerName}
                onChange={e => setControllerName(e.target.value)} shake={shakeName}
                style={{ marginTop:7, marginBottom:14, borderColor: controllerName ? C.ok : C.border }} />
              <Tag text="Mesiac inventúry" />
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                style={{ width:'100%', marginTop:7, padding:'12px 14px', borderRadius:12, border:`1px solid ${C.border}`, background:'rgba(255,255,255,0.85)', color:C.text, fontSize:15, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
                {MONTHS.map(m => <option key={m} style={{ background:C.modal }}>{m}</option>)}
              </select>
            </Glass>

            {savedAt && (
              <div style={{ textAlign:'right', fontSize:10, color:C.muted, marginBottom:4 }}>
                💾 Automaticky uložené o {savedAt}
              </div>
            )}

            {/* Search */}
            <Glass style={{ padding:'13px 16px', marginBottom:10, display:'flex', alignItems:'center', gap:10,
                            border:`2px solid ${C.goldLine}`,
                            background:`linear-gradient(135deg, rgba(184,112,32,0.10), rgba(255,255,255,0.85))`,
                            boxShadow:`0 2px 14px rgba(184,112,32,0.15)` }}>
              <span style={{ color:C.gold, fontSize:20, lineHeight:1 }}>🔍</span>
              <Inp placeholder="Hľadať položku…" value={invSearch} onChange={e => setInvSearch(e.target.value)}
                tabIndex={-1}
                style={{ border:'none', padding:'4px 0', background:'transparent', fontSize:16, fontWeight:600, color:C.text }} />
              {invSearch && <span onClick={() => setInvSearch('')} style={{ color:C.gold, fontSize:18, cursor:'pointer', fontWeight:700 }}>✕</span>}
            </Glass>

            {/* Inventory progress */}
            {(() => {
              const total  = invData.reduce((s,g) => s + g.items.length, 0);
              const filled = invData.reduce((s,g) => s + g.items.filter(i => (invQty[i.id]||[]).some(r => r.qty)).length, 0);
              const pctInv = total === 0 ? 0 : Math.round(filled / total * 100);
              return (
                <div style={{ marginBottom:10, padding:'12px 16px', borderRadius:16, background:C.panel, border:`1px solid ${C.border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:C.sub, letterSpacing:.3 }}>Postup inventúry</span>
                    <span style={{ fontSize:13, fontWeight:800, color: pctInv===100 ? C.ok : C.gold }}>{filled} / {total}</span>
                  </div>
                  <div style={{ height:5, background:C.border, borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pctInv}%`, background: pctInv===100 ? C.ok : C.gold, borderRadius:4, transition:'width .4s ease', boxShadow: pctInv>0 ? `0 0 8px ${pctInv===100 ? C.ok : C.gold}55` : 'none' }} />
                  </div>
                </div>
              );
            })()}

            {/* Categories */}
            <div>
            {invData.map(group => {
              const s = strip(invSearch);
              const catMatch = strip(group.category).includes(s);
              const items = s ? (catMatch ? group.items : group.items.filter(i => strip(i.name).includes(s))) : group.items;
              if (s && !catMatch && items.length === 0) return null;
              const open = expCat === group.category || !!invSearch;
              return (
                <Glass key={group.category} style={{ overflow:'hidden', marginBottom:16, borderLeft:`4px solid ${C.gold}` }}>
                  <div onClick={() => setExpCat(open && !invSearch ? null : group.category)}
                    style={{ padding:'15px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer',
                             background:`linear-gradient(135deg, rgba(184,112,32,0.14), rgba(184,112,32,0.05))`,
                             borderBottom: open ? `1px solid ${C.goldLine}` : 'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontWeight:800, fontSize:15, color:C.gold, letterSpacing:.6, textTransform:'uppercase' }}>{group.category}</span>
                      <span style={{ fontSize:11, color:C.gold, fontWeight:700, opacity:.7 }}>({group.items.length})</span>
                    </div>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      {editMode && <span onClick={e => { e.stopPropagation(); setAddingTo(group.category); }}
                        style={{ display:'inline-flex', alignItems:'center', gap:4, color:C.gold, fontSize:11, fontWeight:700, cursor:'pointer', lineHeight:1,
                                 padding:'5px 9px', borderRadius:8, background:'rgba(255,255,255,0.6)', border:`1px solid ${C.goldLine}` }}>
                        + Produkt</span>}
                      {editMode && <span onClick={e => { e.stopPropagation(); if(window.confirm(`Zmazať "${group.category}"?`)) setInvData(invData.filter(g=>g.category!==group.category)); }}
                        style={{ display:'inline-flex', alignItems:'center', gap:4, color:C.err, fontSize:11, fontWeight:700, cursor:'pointer', lineHeight:1,
                                 padding:'5px 9px', borderRadius:8, background:C.errDim, border:`1px solid ${C.err}33` }}>
                        ✕ Kategóriu</span>}
                      <span style={{ color:C.muted, fontSize:10 }}>{open ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {open && (
                    <div style={{ padding:'8px 8px' }}>
                      {items.map((item, idx) => (
                        <div key={item.id} style={{
                          padding:'12px 10px',
                          marginBottom: idx < items.length-1 ? 10 : 0,
                          borderRadius:12,
                          background: idx % 2 === 1 ? 'rgba(150,120,80,0.07)' : 'rgba(255,255,255,0.5)',
                          borderTop: `1.5px solid rgba(90,70,45,0.28)`,
                          borderBottom: `1.5px solid rgba(90,70,45,0.28)`,
                        }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                              {editMode && <span onClick={() => { if(window.confirm(`Zmazať "${item.name}"?`)) setInvData(invData.map(g => g.category===group.category ? {...g, items: g.items.filter(i=>i.id!==item.id)} : g)); }}
                                style={{ display:'inline-flex', alignItems:'center', gap:5, color:C.err, fontSize:11, cursor:'pointer', lineHeight:1, flexShrink:0,
                                         padding:'4px 8px', borderRadius:8, background:C.errDim, border:`1px solid ${C.err}33`, fontWeight:700 }}>
                                ✕ Zmazať</span>}
                              <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{item.name}</span>
                            </div>
                            <span style={{ fontSize:10, color:C.gold, fontWeight:700, padding:'2px 7px', border:`1px solid ${C.goldLine}`, borderRadius:8 }}>{item.unit}</span>
                          </div>
                          <div style={{ display:'flex', gap:7, alignItems:'flex-start' }}>
                            {/* Portos kód */}
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0 }}>
                              <Inp type="text" placeholder="Kód" value={item.portosCode||''}
                                readOnly={!!item.portosCode}
                                onChange={e => !item.portosCode && setInvData(invData.map(g => g.category===group.category ? {...g, items: g.items.map(i => i.id===item.id ? {...i, portosCode: e.target.value} : i)} : g))}
                                style={{ width:60, padding:'9px 6px', textAlign:'center', fontSize:12, color:C.sub, borderColor: item.portosCode ? C.goldLine : C.border, cursor: item.portosCode ? 'not-allowed' : 'text', opacity: item.portosCode ? 0.7 : 1 }} />
                              <span style={{ fontSize:9, color:C.muted, whiteSpace:'nowrap' }}>portos kód</span>
                            </div>
                            {/* Multi-qty + note */}
                            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:5 }}>
                              {(invQty[item.id]||[]).map(row => (
                                <div key={row.id}>
                                  <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                                    {/* Qty — tap otvori numpad modal (tablet-friendly) */}
                                    <div
                                      onPointerDown={e => { tapStartRef.current = { x: e.clientX, y: e.clientY }; }}
                                      onPointerUp={e => { if (Math.abs(e.clientX - tapStartRef.current.x) + Math.abs(e.clientY - tapStartRef.current.y) < 10) setInvNumpad({ itemId: item.id, rowId: row.id, value: row.qty || '', unit: item.unit, itemName: item.name }); }}
                                      style={{
                                        width:70, padding:'9px 8px', borderRadius:12, boxSizing:'border-box',
                                        border:`1px solid ${row.qty ? C.goldLine : C.border}`,
                                        background: row.qty ? C.goldDim : 'rgba(255,255,255,0.85)',
                                        color: row.qty ? C.gold : C.muted,
                                        fontSize:16, fontWeight:800, textAlign:'center',
                                        touchAction:'manipulation', cursor:'pointer', userSelect:'none', WebkitUserSelect:'none',
                                        WebkitTapHighlightColor:'transparent',
                                        minHeight:40, display:'flex', alignItems:'center', justifyContent:'center',
                                        flexShrink:0,
                                      }}>
                                      {row.qty || '0'}
                                    </div>
                                    <span style={{ fontSize:11, color:C.muted, flexShrink:0 }}>{item.unit}</span>
                                    <Inp placeholder="Miesto (napr. Bar)" value={row.label}
                                      tabIndex={-1}
                                      onChange={e => updateQtyRow(item.id, row.id, 'label', e.target.value)}
                                      onFocus={e => { activeInputRef.current = e.target; setActiveInvField({ itemId: item.id, rowId: row.id, field: 'label' }); }}
                                      onBlur={() => { activeInputRef.current = null; setActiveInvField(null); }}
                                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
                                      enterKeyHint="done"
                                      style={{ flex:1, padding:'8px 10px', fontSize:12 }} />
                                    <span onClick={() => removeQtyRow(item.id, row.id)}
                                      style={{ color:C.muted, fontSize:14, cursor:'pointer', lineHeight:1, padding:'0 2px', flexShrink:0 }}>✕</span>
                                  </div>
                                  {/* Action strip pre label pole */}
                                  {activeInvField?.itemId === item.id && activeInvField?.rowId === row.id && activeInvField?.field === 'label' && (
                                    <div style={{ display:'flex', gap:6, marginTop:4 }}>
                                      <button
                                        onTouchStart={e => { e.preventDefault(); e.stopPropagation(); updateQtyRow(item.id, row.id, 'label', ''); dismissKeyboard(); setActiveInvField(null); }}
                                        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); updateQtyRow(item.id, row.id, 'label', ''); dismissKeyboard(); setActiveInvField(null); }}
                                        style={{ flex:1, padding:'6px', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                                        Zrušiť
                                      </button>
                                      <button
                                        onTouchStart={e => { e.preventDefault(); e.stopPropagation(); dismissKeyboard(); setActiveInvField(null); }}
                                        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); dismissKeyboard(); setActiveInvField(null); }}
                                        style={{ flex:2, padding:'6px', borderRadius:8, border:`1px solid ${C.goldLine}`, background:C.goldDim, color:C.gold, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                                        OK ✓
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                              <button onClick={() => addQtyRow(item.id, item.name, item.unit)} style={{
                                alignSelf:'flex-start', background:'none',
                                border:`1px dashed ${C.goldLine}`, color:C.gold,
                                fontSize:11, fontWeight:600, padding:'5px 10px',
                                borderRadius:8, cursor:'pointer', fontFamily:'inherit',
                              }}>+ Pridať množstvo</button>
                              {(invQty[item.id]||[]).length > 1 && (() => {
                                const total = qtyTotal(item.id);
                                return (
                                  <div style={{ fontSize:11, fontWeight:700, color:C.gold, paddingLeft:2 }}>
                                    Spolu: <span key={total} className="number-flip">{total}</span> {item.unit}
                                  </div>
                                );
                              })()}
                              <Inp type="text" placeholder="Poznámka…" value={invNotes[item.id]||''}
                                tabIndex={-1}
                                onChange={e => setInvNotes({...invNotes,[item.id]:e.target.value})}
                                onFocus={e => { activeInputRef.current = e.target; setActiveInvField({ itemId: item.id, rowId: 'note', field: 'note' }); }}
                                onBlur={() => { activeInputRef.current = null; setActiveInvField(null); }}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
                                enterKeyHint="done"
                                style={{ width:'100%', padding:'8px 10px', fontSize:12, borderStyle:'dashed' }} />
                              {activeInvField?.itemId === item.id && activeInvField?.field === 'note' && (
                                <div style={{ display:'flex', gap:6, marginTop:4 }}>
                                  <button
                                    onTouchStart={e => { e.preventDefault(); e.stopPropagation(); setInvNotes({...invNotes,[item.id]:''}); dismissKeyboard(); setActiveInvField(null); }}
                                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setInvNotes({...invNotes,[item.id]:''}); dismissKeyboard(); setActiveInvField(null); }}
                                    style={{ flex:1, padding:'6px', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                                    Zrušiť
                                  </button>
                                  <button
                                    onTouchStart={e => { e.preventDefault(); e.stopPropagation(); dismissKeyboard(); setActiveInvField(null); }}
                                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); dismissKeyboard(); setActiveInvField(null); }}
                                    style={{ flex:2, padding:'6px', borderRadius:8, border:`1px solid ${C.goldLine}`, background:C.goldDim, color:C.gold, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                                    OK ✓
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {items.length===0 && <div style={{ color:C.muted, fontSize:12, padding:'6px 0', textAlign:'center' }}>Žiadne položky</div>}
                    </div>
                  )}
                </Glass>
              );
            })}
            </div>

            <button onClick={() => {
              if (!needName()) return;
              const missing = invData.flatMap(g => g.items).filter(item => !(invQty[item.id]||[]).some(r => r.qty));
              if (missing.length > 0) { setMissingWarning(missing); return; }
              const allItems = invData.flatMap(g => g.items).filter(item => (invQty[item.id]||[]).some(r => r.qty));
              const _invTabName = `${selectedMonth} ${new Date().getFullYear()} — ${new Date().toLocaleTimeString('sk-SK', { hour:'2-digit', minute:'2-digit' })}`;
              sendToSheets('inventory', {
                date: new Date().toLocaleDateString('sk-SK'),
                month: _invTabName,
                inspector: controllerName || 'Anonym',
                items: allItems.map(item => {
                  const rows = (invQty[item.id]||[]).filter(r => r.qty);
                  const breakdown = rows.map(r => r.label ? `${r.label}: ${r.qty}` : r.qty).join(' + ');
                  return { name: item.name, unit: item.unit, qty: qtyTotal(item.id), breakdown, note: invNotes[item.id] || '' };
                }),
              });
              setSuccess(true);
            }} style={{
              width:'100%', padding:'16px', marginBottom:8, borderRadius:14,
              background:C.gold, border:'none',
              color:'#fff', fontWeight:800, fontSize:14, letterSpacing:.8,
              cursor:'pointer', fontFamily:'inherit',
              boxShadow:`0 4px 18px rgba(184,112,32,0.35)`,
            }}>
              Odoslať inventúru
            </button>

            <button onClick={exportPortos} style={{
              width:'100%', padding:'14px', marginBottom:8, borderRadius:14,
              background:'transparent', border:`1px solid ${C.border}`,
              color:C.sub, fontWeight:700, fontSize:13, letterSpacing:.5,
              cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}>
              <span style={{ fontSize:15 }}>⬇</span> Exportovať pre PORTOS
            </button>

            <button onClick={() => {
              if(window.confirm('Naozaj chceš začať novú inventúru? Vymažú sa množstvá, poznámky a meno.')) {
                setInvQty({});
                setInvNotes({});
                setControllerName('');
              }
            }} style={{
              width:'100%', padding:'14px', marginBottom:8, borderRadius:14,
              background:'transparent', border:`1px solid rgba(220,60,60,0.4)`,
              color:'rgba(220,100,100,0.9)', fontWeight:700, fontSize:13, letterSpacing:.5,
              cursor:'pointer', fontFamily:'inherit',
            }}>
              ↺ Nová inventúra
            </button>

            {/* Add category — len v editačnom režime */}
            {editMode && (
              <Glass style={{ padding:'14px 16px', border:`1px dashed ${C.goldLine}` }}>
                <Inp placeholder="Nová kategória…" value={newCat} onChange={e => setNewCat(e.target.value)} style={{ marginBottom:9 }} />
                <button onClick={() => { if(newCat.trim()){setInvData([...invData,{category:newCat,items:[]}]);setNewCat('');} }}
                  style={{ width:'100%', padding:'11px', background:C.panel, border:`1px solid ${C.border}`, color:C.text, borderRadius:12, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  + Pridať kategóriu
                </button>
              </Glass>
            )}

            {/* Editačný režim prepínač — úplne dole */}
            <div onClick={() => setConfirmEditMode(true)}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginTop:6,
                       padding:'12px', borderRadius:14, cursor:'pointer', userSelect:'none',
                       border:`1px solid ${editMode ? C.goldLine : C.border}`,
                       background: editMode ? C.goldDim : 'transparent' }}>
              <span style={{ fontSize:13, fontWeight:700, letterSpacing:.5, color: editMode ? C.gold : C.muted }}>
                {editMode ? '🔓 Editácia zapnutá' : '🔒 Editácia'}
              </span>
              <div style={{ width:38, height:22, borderRadius:11, padding:2, transition:'background .2s',
                            background: editMode ? C.gold : 'rgba(150,120,80,0.25)', flexShrink:0 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', transition:'transform .2s',
                              transform: editMode ? 'translateX(16px)' : 'translateX(0)',
                              boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
              </div>
            </div>

            {/* Záloha dát — export/import localStorage */}
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button onClick={exportBackup} style={{
                flex:1, padding:'12px', borderRadius:14, border:`1px solid ${C.border}`,
                background:'transparent', color:C.sub, fontWeight:700, fontSize:12,
                cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              }}>
                💾 Exportovať zálohu
              </button>
              <label style={{
                flex:1, padding:'12px', borderRadius:14, border:`1px solid ${C.border}`,
                background:'transparent', color:C.sub, fontWeight:700, fontSize:12,
                cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                boxSizing:'border-box',
              }}>
                📥 Obnoviť zálohu
                <input type="file" accept=".json,application/json" style={{ display:'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value = ''; }} />
              </label>
            </div>
            <div style={{ fontSize:10, color:C.muted, textAlign:'center', marginTop:4, lineHeight:1.5 }}>
              Záloha obsahuje úlohy, katalóg, inventúru, odpisy aj nastavenia.<br />Ulož si ju pred výmenou zariadenia alebo čistením prehliadača.
            </div>
          </div>
        )}

        {/* ── NOTES ────────────────────────────────────────────────────────── */}
        {tab === 'notes' && (
          <>
            <Glass style={{ padding:'14px 14px' }}>
              <Tag text="Nová správa" />
              <Inp
                value={noteAuthor}
                onChange={e => setNoteAuthor(e.target.value)}
                placeholder="Tvoje meno…"
                style={{ marginTop:8, marginBottom:8 }}
              />
              <div style={{ display:'flex', gap:8 }}>
                <Inp value={newNote} onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newNote.trim()) {
                      setNotes([{ id: Date.now(), text: newNote, author: noteAuthor.trim() || 'Anonym', time: new Date().toLocaleString('sk-SK', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) }, ...notes]);
                      setNewNote('');
                    }
                  }}
                  placeholder="Napíš oznam…" style={{ flex:1 }} />
                <button onClick={() => {
                  if (newNote.trim()) {
                    setNotes([{ id: Date.now(), text: newNote, author: noteAuthor.trim() || 'Anonym', time: new Date().toLocaleString('sk-SK', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) }, ...notes]);
                    setNewNote('');
                  }
                }} style={{ padding:'0 16px', background:C.goldDim, border:`1px solid ${C.goldLine}`, color:C.gold, borderRadius:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', fontSize:13 }}>
                  Odoslať
                </button>
              </div>
            </Glass>

            {notes.length === 0 && (
              <div style={{ textAlign:'center', color:C.muted, fontSize:13, paddingTop:50 }}>Žiadne správy</div>
            )}

            <div style={{ display: isTablet && notes.length > 1 ? 'grid' : 'block', gridTemplateColumns: isDesktop ? '1fr 1fr 1fr' : '1fr 1fr', gap: 8 }}>
            {notes.map(n => (

              <Glass key={n.id} style={{ padding:'14px 16px', borderLeft:`2px solid ${C.goldLine}`, marginBottom: isTablet ? 0 : 8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <div style={{ fontSize:14, color:C.text, lineHeight:1.6, flex:1 }}>{n.text}</div>
                  <button onClick={() => setNotes(notes.filter(x => x.id !== n.id))}
                    style={{ background:'none', border:'none', color:C.muted, fontSize:16, cursor:'pointer', padding:'0 2px', lineHeight:1, flexShrink:0 }}>×</button>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:C.gold, opacity:.8 }}>{n.author || 'Anonym'}</span>
                  <span style={{ fontSize:10, color:C.muted }}>{n.time || new Date(n.id).toLocaleString('sk-SK', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>
                </div>
              </Glass>
            ))}
            </div>
          </>
        )}

        {/* ── ODPISY ───────────────────────────────────────────────────────── */}
        {tab === 'odpisy' && (() => {
          const todayData    = getDayData(todayKey);
          const todayEntries = todayData.entries;
          const yesterdayData = getDayData(yesterdayKey);
          const allItems = invData.flatMap(g => g.items);
          const searchResults = odpisySearch.trim()
            ? allItems.filter(i => strip(i.name).includes(strip(odpisySearch))).slice(0, 8)
            : [];
          const { year, month } = odpisySummaryDate;
          const summary = getMonthSummary(year, month);
          const dovorColors = { 'Spotreba': C.ok, 'Pokazené': C.err, 'Rozbité': '#d07010', 'Ochutnávka': '#7a60b0' };
          // ── Prehliadač po dňoch ──────────────────────────────────────────────
          const keyToDate = (key) => { const [y, m, dd] = key.split('-').map(Number); return new Date(y, m - 1, dd); };
          const shiftBrowse = (delta) => setOdpisyBrowseKey(k => { const dt = keyToDate(k); dt.setDate(dt.getDate() + delta); return localDayKey(dt); });
          const beforeYesterdayKey = (() => { const dt = keyToDate(todayKey); dt.setDate(dt.getDate() - 2); return localDayKey(dt); })();
          const browseData = getDayData(odpisyBrowseKey);
          const browseEntries = browseData.entries.filter(e => e.qty && parseQty(e.qty) !== 0);
          const browseRel = odpisyBrowseKey === todayKey ? 'Dnes' : odpisyBrowseKey === yesterdayKey ? 'Včera' : odpisyBrowseKey === beforeYesterdayKey ? 'Predvčerom' : null;
          const browseDateLabel = (() => { const s = keyToDate(odpisyBrowseKey).toLocaleDateString('sk-SK', { weekday:'long', day:'numeric', month:'long' }); return s.charAt(0).toUpperCase() + s.slice(1); })();
          const browseCanNext = odpisyBrowseKey < todayKey;
          return (
            <>
              {/* Meno zodpovedného */}
              <Glass accent style={{ padding:'14px 16px' }}>
                <Tag text="Zodpovedná osoba" />
                <Inp type="text" placeholder="Tvoje meno…" value={odpisyAuthor}
                  onChange={e => setOdpisyAuthor(e.target.value)}
                  style={{ marginTop:7, borderColor: odpisyAuthor ? C.ok : C.border }} />
              </Glass>

              {/* Odkaz od kolegu včera */}
              {yesterdayData.note && (
                <div style={{ margin:'0 0 8px', padding:'12px 16px', borderRadius:14, background:`${C.goldDim}`, border:`1px solid ${C.goldLine}`, display:'flex', gap:10, alignItems:'flex-start' }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>💬</span>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:C.gold, letterSpacing:.5, textTransform:'uppercase', marginBottom:3 }}>Odkaz od včera</div>
                    <div style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>{yesterdayData.note}</div>
                  </div>
                </div>
              )}

              {/* Dnešné odpisy */}
              <Glass style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <Tag text="Dnešné odpisy" />
                  <span style={{ fontSize:11, color:C.muted }}>
                    {now.toLocaleDateString('sk-SK', { weekday:'long', day:'numeric', month:'long' })}
                  </span>
                </div>

                {/* Vyhľadávanie produktu */}
                <div style={{ position:'relative', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:12, border:`1px solid ${C.goldLine}`, background:'rgba(255,255,255,0.85)' }}>
                    <span style={{ color:C.muted, fontSize:14 }}>⌕</span>
                    <input placeholder="Hľadať a pridať produkt…" value={odpisySearch}
                      onChange={e => setOdpisySearch(e.target.value)}
                      style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:14, color:C.text, fontFamily:'inherit' }} />
                    {odpisySearch && <span onClick={() => setOdpisySearch('')} style={{ color:C.muted, fontSize:14, cursor:'pointer' }}>✕</span>}
                  </div>
                  {searchResults.length > 0 && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:20, background:C.modal, border:`1px solid ${C.border}`, borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', marginTop:4, overflow:'hidden' }}>
                      {searchResults.map(item => (
                        <div key={item.id} onClick={() => addOdpis(item)}
                          style={{ padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', borderBottom:`1px solid ${C.border}` }}>
                          <span style={{ fontSize:14, color:C.text }}>{item.name}</span>
                          <span style={{ fontSize:11, color:C.gold, fontWeight:700, padding:'2px 8px', border:`1px solid ${C.goldLine}`, borderRadius:8 }}>{item.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Zoznam dnešných odpisov */}
                {todayEntries.length === 0 ? (
                  <div style={{ textAlign:'center', color:C.muted, fontSize:13, padding:'16px 0' }}>
                    Zatiaľ žiadne odpisy na dnes — vyhľadaj produkt vyššie
                  </div>
                ) : todayEntries.map(entry => (
                  <div key={entry.id} style={{ marginBottom:10, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>
                    {/* Riadok: názov + qty + jednotka + zmazať */}
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <div style={{ flex:1, fontSize:13, fontWeight:600, color:C.text, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{entry.name}</div>
                      {/* Qty — tap otvorí numpad (rovnaký ako v Sklade) */}
                      <div
                        onPointerDown={e => { tapStartRef.current = { x: e.clientX, y: e.clientY }; }}
                        onPointerUp={e => { if (Math.abs(e.clientX - tapStartRef.current.x) + Math.abs(e.clientY - tapStartRef.current.y) < 10) setInvNumpad({ kind:'odpis', itemId: todayKey, rowId: entry.id, value: entry.qty || '', unit: entry.unit, itemName: entry.name }); }}
                        style={{
                          width:70, padding:'9px 8px', borderRadius:12, boxSizing:'border-box',
                          border:`1px solid ${entry.qty ? C.goldLine : C.border}`,
                          background: entry.qty ? C.goldDim : 'rgba(255,255,255,0.85)',
                          color: entry.qty ? C.gold : C.muted,
                          fontSize:16, fontWeight:800, textAlign:'center',
                          touchAction:'manipulation', cursor:'pointer', userSelect:'none', WebkitUserSelect:'none',
                          WebkitTapHighlightColor:'transparent',
                          minHeight:40, display:'flex', alignItems:'center', justifyContent:'center',
                          flexShrink:0,
                        }}>
                        {entry.qty || '0'}
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color:C.gold, border:`1px solid ${C.goldLine}`, padding:'3px 8px', borderRadius:8, flexShrink:0 }}>{entry.unit}</span>
                      <span onClick={() => removeOdpis(todayKey, entry.id)} style={{ color:C.muted, fontSize:16, cursor:'pointer', flexShrink:0, lineHeight:1 }}>✕</span>
                    </div>
                    {/* Dôvod odpisu — chips */}
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {ODPISOVY_DOVODY.map(d => {
                        const active = (entry.reason || 'Spotreba') === d;
                        const col = dovorColors[d];
                        return (
                          <button key={d} onClick={() => updateOdpisReason(todayKey, entry.id, d)} style={{
                            padding:'3px 10px', borderRadius:20, border:`1px solid ${active ? col : C.border}`,
                            background: active ? hexToRgba(col, 0.12) : 'transparent',
                            color: active ? col : C.muted,
                            fontSize:10, fontWeight: active ? 700 : 500, cursor:'pointer', fontFamily:'inherit',
                            transition:'all .15s',
                          }}>{d}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Odkaz kolegovi */}
                <div style={{ marginTop: todayEntries.length > 0 ? 10 : 4 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.sub, letterSpacing:.5, textTransform:'uppercase', marginBottom:6 }}>💬 Odkaz kolegovi</div>
                  <textarea
                    placeholder="Zanechaj odkaz pre ďalšiu smenu…"
                    value={todayData.note}
                    onChange={e => setDayNote(todayKey, e.target.value)}
                    rows={2}
                    style={{
                      width:'100%', padding:'10px 12px', borderRadius:12,
                      border:`1px solid ${todayData.note ? C.goldLine : C.border}`,
                      background:'rgba(255,255,255,0.85)', color:C.text,
                      fontSize:13, lineHeight:1.5, fontFamily:'inherit',
                      outline:'none', resize:'none', boxSizing:'border-box',
                    }} />
                </div>

                {/* Info o auto-odoslaní */}
                {todayEntries.length > 0 && (
                  <div style={{ marginTop:14, padding:'10px 14px', borderRadius:12, background:C.okDim, border:`1px solid ${C.ok}44`, display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:14 }}>🌙</span>
                    <span style={{ fontSize:11, color:C.ok, fontWeight:600, lineHeight:1.4 }}>Odpisy sa automaticky odošlú do tabuľky o polnoci</span>
                  </div>
                )}
              </Glass>

              {/* Prehľad po dňoch (len na čítanie) */}
              <Glass style={{ padding:'14px 16px', marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <Tag text="Prehľad po dňoch" />
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span onClick={() => shiftBrowse(-1)} style={{ color:C.gold, cursor:'pointer', fontSize:16, padding:'0 4px' }}>◀</span>
                    <span style={{ fontSize:12, fontWeight:700, color:C.sub, minWidth:74, textAlign:'center' }}>
                      {browseRel || keyToDate(odpisyBrowseKey).toLocaleDateString('sk-SK', { day:'2-digit', month:'2-digit' })}
                    </span>
                    <span onClick={() => browseCanNext && shiftBrowse(1)} style={{ color: browseCanNext ? C.gold : C.muted, cursor: browseCanNext ? 'pointer' : 'default', fontSize:16, padding:'0 4px', opacity: browseCanNext ? 1 : 0.35 }}>▶</span>
                  </div>
                </div>

                {/* Plný dátum vybraného dňa */}
                <div style={{ fontSize:11, color:C.muted, marginBottom:10 }}>{browseDateLabel}</div>

                {/* Rýchle skoky */}
                <div style={{ display:'flex', gap:6, marginBottom:12 }}>
                  {[{ k: todayKey, l: 'Dnes' }, { k: yesterdayKey, l: 'Včera' }, { k: beforeYesterdayKey, l: 'Predvčerom' }].map(({ k, l }) => {
                    const active = odpisyBrowseKey === k;
                    return (
                      <button key={k} onClick={() => setOdpisyBrowseKey(k)} style={{
                        padding:'5px 12px', borderRadius:20, border:`1px solid ${active ? C.goldLine : C.border}`,
                        background: active ? C.goldDim : 'transparent', color: active ? C.gold : C.muted,
                        fontSize:11, fontWeight: active ? 700 : 500, cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                      }}>{l}</button>
                    );
                  })}
                </div>

                {/* Zoznam odpisov daného dňa */}
                {browseEntries.length === 0 ? (
                  <div style={{ textAlign:'center', color:C.muted, fontSize:13, padding:'16px 0' }}>
                    Žiadne odpisy v tento deň
                  </div>
                ) : (
                  <>
                    {browseEntries.map(entry => {
                      const col = dovorColors[entry.reason || 'Spotreba'] || C.muted;
                      return (
                        <div key={entry.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                          <span style={{ flex:1, fontSize:13, color:C.text, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{entry.name}</span>
                          <span style={{ fontSize:10, fontWeight:700, color:col, border:`1px solid ${hexToRgba(col, 0.4)}`, background:hexToRgba(col, 0.1), padding:'2px 8px', borderRadius:20, flexShrink:0 }}>{entry.reason || 'Spotreba'}</span>
                          <div style={{ display:'flex', alignItems:'baseline', gap:4, flexShrink:0, minWidth:50, justifyContent:'flex-end' }}>
                            <span style={{ fontSize:15, fontWeight:800, color:C.gold }}>{entry.qty}</span>
                            <span style={{ fontSize:11, color:C.muted }}>{entry.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                    {browseData.note && (
                      <div style={{ marginTop:10, padding:'10px 12px', borderRadius:12, background:C.goldDim, border:`1px solid ${C.goldLine}`, display:'flex', gap:8, alignItems:'flex-start' }}>
                        <span style={{ fontSize:14, flexShrink:0 }}>💬</span>
                        <span style={{ fontSize:12, color:C.text, lineHeight:1.5 }}>{browseData.note}</span>
                      </div>
                    )}
                    <div style={{ marginTop:8, padding:'8px 0 0', fontSize:11, color:C.muted, textAlign:'right' }}>
                      {browseEntries.length} položiek
                    </div>
                  </>
                )}
              </Glass>

              {/* Mesačný súhrn */}
              <Glass style={{ padding:'14px 16px', marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <Tag text="Mesačný súhrn" />
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span onClick={() => setOdpisySummaryDate(prev => {
                      const m = prev.month === 0 ? 11 : prev.month - 1;
                      const y = prev.month === 0 ? prev.year - 1 : prev.year;
                      return { year: y, month: m };
                    })} style={{ color:C.gold, cursor:'pointer', fontSize:16, padding:'0 4px' }}>◀</span>
                    <span style={{ fontSize:12, fontWeight:700, color:C.sub, minWidth:90, textAlign:'center' }}>{MONTHS[month]} {year}</span>
                    <span onClick={() => setOdpisySummaryDate(prev => {
                      const m = prev.month === 11 ? 0 : prev.month + 1;
                      const y = prev.month === 11 ? prev.year + 1 : prev.year;
                      return { year: y, month: m };
                    })} style={{ color:C.gold, cursor:'pointer', fontSize:16, padding:'0 4px' }}>▶</span>
                  </div>
                </div>

                {summary.length === 0 ? (
                  <div style={{ textAlign:'center', color:C.muted, fontSize:13, padding:'16px 0' }}>
                    Žiadne odpisy pre {MONTHS[month]} {year}
                  </div>
                ) : (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns: isTablet ? '1fr 1fr' : '1fr', gap: isTablet ? '0 24px' : 0 }}>
                      {summary.map((row, i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                          <span style={{ fontSize:13, color:C.text, flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginRight:8 }}>{row.name}</span>
                          <div style={{ display:'flex', alignItems:'baseline', gap:5, flexShrink:0 }}>
                            <span style={{ fontSize:15, fontWeight:800, color:C.gold }}>{row.total}</span>
                            <span style={{ fontSize:11, color:C.muted }}>{row.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop:8, padding:'8px 0', borderTop:`1px solid ${C.border}`, fontSize:11, color:C.muted, textAlign:'right' }}>
                      {summary.length} položiek
                    </div>
                    <button onClick={() => setConfirmExportPdf(true)} style={{
                      width:'100%', marginTop:10, padding:'13px', borderRadius:14,
                      background:C.gold, border:'none', color:'#fff',
                      fontWeight:800, fontSize:14, letterSpacing:.5, cursor:'pointer', fontFamily:'inherit',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      boxShadow:`0 4px 18px rgba(184,112,32,0.35)`,
                    }}>
                      <span>📄</span> Exportovať do PDF
                    </button>
                  </>
                )}
              </Glass>
            </>
          );
        })()}

        {/* ── UZÁVIERKA ────────────────────────────────────────────────────── */}
        {tab === 'uzavierka' && (() => {
          const d = getUzav(todayKey);
          const H = uzavH(d);
          const J = H - num(d.I);
          const M = H - num(d.K);
          const carry = uzavPrevM(todayKey);
          // Rozdiel: reálne prerátané A vs to, čo malo zostať (minulý zostatok). Len keď je A vyplnené.
          const rozdielA = (carry != null && (d.A ?? '') !== '') ? (num(d.A) - carry) : null;
          // Prvotné prerátanie (audit) — ak prvé zadané A nesedelo, ostáva to zaznamenané aj po oprave
          const firstRozdiel = (carry != null && (d.firstA ?? '') !== '') ? (num(d.firstA) - carry) : null;
          const firstMismatch = firstRozdiel != null && Math.abs(firstRozdiel) >= 0.005;
          const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2);
          // Vstupné pole sumy — tap otvorí numpad (kind 'uzavierka')
          const amount = (fieldKey, label, opts = {}) => {
            const val = d[fieldKey];
            return (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:`1px solid ${C.border}` }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color: opts.info ? C.muted : C.text, lineHeight:1.3 }}>{label}</div>
                  {opts.hint && <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{opts.hint}</div>}
                </div>
                <div
                  onPointerDown={e => { tapStartRef.current = { x: e.clientX, y: e.clientY }; }}
                  onPointerUp={e => { if (Math.abs(e.clientX - tapStartRef.current.x) + Math.abs(e.clientY - tapStartRef.current.y) < 10) setInvNumpad({ kind:'uzavierka', dayKey: todayKey, fieldKey, value:(val || '').toString(), unit:'€', itemName: label }); }}
                  style={{ width:100, padding:'9px 8px', borderRadius:12, boxSizing:'border-box',
                           border:`1px solid ${val ? C.goldLine : C.border}`,
                           background: val ? C.goldDim : 'rgba(255,255,255,0.85)',
                           color: val ? C.gold : C.muted,
                           fontSize:15, fontWeight:800, textAlign:'center',
                           touchAction:'manipulation', cursor:'pointer', userSelect:'none', WebkitUserSelect:'none', WebkitTapHighlightColor:'transparent',
                           minHeight:40, display:'flex', alignItems:'center', justifyContent:'center', gap:3, flexShrink:0 }}>
                  {val || '0'} <span style={{ fontSize:11, fontWeight:600 }}>€</span>
                </div>
              </div>
            );
          };
          // Vypočítaný riadok (H, J, M)
          const calc = (label, value, formula, color) => (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 12px', borderRadius:12, marginTop:8,
                          background: color ? hexToRgba(color, 0.1) : C.goldDim, border:`1px solid ${color ? hexToRgba(color, 0.4) : C.goldLine}` }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:800, color: color || C.gold }}>{label}</div>
                <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{formula}</div>
              </div>
              <div style={{ fontSize:18, fontWeight:800, color: color || C.gold, flexShrink:0 }}>{value} €</div>
            </div>
          );
          return (
            <>
              {/* Hlavička */}
              <Glass accent style={{ padding:'14px 16px' }}>
                <Tag text="Denná uzávierka" />
                <div style={{ display:'flex', gap:10, marginTop:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:C.muted, marginBottom:3, textTransform:'uppercase', letterSpacing:.5, fontWeight:700 }}>Dátum</div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{now.toLocaleDateString('sk-SK', { weekday:'short', day:'numeric', month:'long' })}</div>
                  </div>
                  <div style={{ width:88 }}>
                    <div style={{ fontSize:10, color:C.muted, marginBottom:3, textTransform:'uppercase', letterSpacing:.5, fontWeight:700 }}>Číslo kasy</div>
                    <Inp type="text" inputMode="numeric" placeholder="č." value={d.kasa}
                      onChange={e => setUzavField(todayKey, 'kasa', e.target.value)} style={{ padding:'8px 10px', fontSize:14 }} />
                  </div>
                </div>
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:10, color:C.muted, marginBottom:3, textTransform:'uppercase', letterSpacing:.5, fontWeight:700 }}>Uzávierku vykonal (priezvisko)</div>
                  <Inp type="text" placeholder="Tvoje meno…" value={d.meno}
                    onChange={e => setUzavField(todayKey, 'meno', e.target.value)} style={{ borderColor: d.meno ? C.ok : C.border }} />
                </div>
              </Glass>

              {/* Vstupy + živé výpočty */}
              <Glass style={{ padding:'6px 16px 16px' }}>
                {/* Minulý zostatok — len informácia na overenie pri rannom prerátaní (NEvpisuje sa do A) */}
                {carry != null && (
                  <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 12px', borderRadius:12, background:C.goldDim, border:`1px solid ${C.goldLine}`, marginTop:8 }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>📋</span>
                    <div style={{ lineHeight:1.4 }}>
                      <span style={{ fontSize:11, color:C.muted, fontWeight:600 }}>Zostatok z minulého dňa</span>
                      <div style={{ fontSize:16, fontWeight:800, color:C.gold }}>{fmt(carry)} €
                        <span style={{ fontSize:10.5, color:C.muted, fontWeight:500, marginLeft:6 }}>← ráno prerátaj a over, či ti sedí</span>
                      </div>
                    </div>
                  </div>
                )}
                {amount('A', 'A · Zostatok z predch. dňa (prerátaný)', { hint:'zadaj reálne prerátaný stav' })}
                {/* Kontrola prerátaného A oproti minulému zostatku */}
                {rozdielA != null && (Math.abs(rozdielA) < 0.005 ? (
                  <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 10px', borderRadius:10, marginTop:6,
                                background: hexToRgba(C.ok, 0.1), border:`1px solid ${hexToRgba(C.ok, 0.4)}` }}>
                    <span style={{ fontSize:13 }}>✓</span>
                    <span style={{ fontSize:11.5, fontWeight:700, color: C.ok }}>Sedí s minulým zostatkom</span>
                  </div>
                ) : (
                  <div style={{ padding:'9px 11px', borderRadius:10, marginTop:6,
                                background: hexToRgba(C.err, 0.1), border:`1px solid ${hexToRgba(C.err, 0.4)}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <span style={{ fontSize:14 }}>⚠</span>
                      <span style={{ fontSize:12, fontWeight:800, color: C.err }}>
                        Nesedí o {rozdielA > 0 ? '+' : ''}{fmt(rozdielA)} € — najprv prerátaj znova.
                      </span>
                    </div>
                    <div style={{ fontSize:11, color: C.err, lineHeight:1.45, marginTop:6, marginLeft:21 }}>
                      Ak stále nesedí: <b>zapíš reálny prerátaný stav</b>, ale <b>vklad do kasy urob s {fmt(carry)} €</b> (koľko malo zostať z minula). Manko nahlás zodpovednej osobe — rieši sa na pozadí.
                    </div>
                  </div>
                ))}
                {/* Trvalý audit záznam — prvotné prerátanie nesedelo (ostáva aj po prepísaní A) */}
                {firstMismatch && (
                  <div style={{ display:'flex', gap:7, alignItems:'flex-start', padding:'8px 10px', borderRadius:10, marginTop:6,
                                background: hexToRgba('#c2700f', 0.1), border:`1px solid ${hexToRgba('#c2700f', 0.4)}` }}>
                    <span style={{ fontSize:13 }}>📝</span>
                    <span style={{ fontSize:11, fontWeight:600, color:'#9a560b', lineHeight:1.45 }}>
                      Zaznamená sa do tabuľky: <b>prvotné prerátanie {d.firstA} €</b> nesedelo o <b>{firstRozdiel > 0 ? '+' : ''}{fmt(firstRozdiel)} €</b> (malo byť {fmt(carry)} €). Záznam ostane aj po oprave.
                    </span>
                  </div>
                )}
                {amount('B', 'B · Tržba (obrat bez zaokrúhlenia)')}
                {amount('C', 'C · Platby kartou (+ stravné karty)')}
                {amount('D', 'D · Platby Qerko (tržba + tringelt)')}
                {amount('E', 'E · Z toho Qerko tringelt', { hint:'reálne vyber a vhoď medzi tringelty' })}
                {amount('sk', 'Z toho stravná karta', { info:true, hint:'informatívne — neráta sa' })}
                {amount('F', 'F · Stravné lístky')}
                {amount('G', 'G · Nákup')}
                <textarea placeholder="Obsah nákupu (poznámka k G)…" value={d.gNote}
                  onChange={e => setUzavField(todayKey, 'gNote', e.target.value)} rows={2}
                  style={{ width:'100%', marginTop:8, padding:'9px 12px', borderRadius:12, border:`1px solid ${d.gNote ? C.goldLine : C.border}`, background:'rgba(255,255,255,0.85)', color:C.text, fontSize:13, lineHeight:1.5, fontFamily:'inherit', outline:'none', resize:'none', boxSizing:'border-box' }} />

                {calc('H · Mám mať v kase', fmt(H), 'A + B − C − D − E − F − G')}
                {amount('I', 'I · V kase reálne mám', { hint:'mincovka + suma v obálke' })}
                {calc(J >= 0 ? 'J · Tringelt' : 'J · MANKO', fmt(J), 'H − I', J >= 0 ? C.ok : C.err)}
                {amount('K', 'K · Odvod tržby')}
                {amount('L', 'L · Zaokrúhlenie (so znamienkom)')}
                {calc('M · Nový zostatok', fmt(M), 'H − K  ·  prenáša sa na zajtra')}
              </Glass>

              {d.sent && (
                <div style={{ textAlign:'center', padding:'10px 0 2px', color:C.ok, fontSize:13, fontWeight:700 }}>✓ Uzávierka odoslaná</div>
              )}
              <button disabled={!d.meno.trim()} onClick={() => {
                if (!d.meno.trim()) return;
                sendToSheets('uzavierka_daily', {
                  date: now.toLocaleDateString('sk-SK'),
                  kasa: d.kasa, author: d.meno,
                  A:d.A, B:d.B, C:d.C, D:d.D, E:d.E, stravnaKarta:d.sk, F:d.F, G:d.G, gNote:d.gNote, I:d.I, K:d.K, L:d.L,
                  H: fmt(H), J: fmt(J), M: fmt(M),
                  maloByt: carry != null ? fmt(carry) : '',     // koľko malo zostať (M z minula)
                  rozdielA: rozdielA != null ? fmt(rozdielA) : '',
                  firstA: d.firstA || '',                        // prvé reálne prerátanie A (audit)
                  firstRozdiel: firstRozdiel != null ? fmt(firstRozdiel) : '',
                  nesedeloPrvotne: firstMismatch ? 'ÁNO' : 'NIE',
                });
                markUzavSent(todayKey);
                setSuccess('uzavierka');
              }} style={{
                width:'100%', padding:'14px', marginTop:6,
                background: d.meno.trim() ? C.gold : C.muted, border:'none',
                color:'#fff', borderRadius:14, fontWeight:800, fontSize:14, letterSpacing:.5,
                cursor: d.meno.trim() ? 'pointer' : 'default', fontFamily:'inherit',
                boxShadow: d.meno.trim() ? '0 4px 18px rgba(184,112,32,0.35)' : 'none',
              }}>
                {d.sent ? 'Odoslať znova' : 'Odoslať uzávierku'}
              </button>
              {!d.meno.trim() && <div style={{ textAlign:'center', fontSize:11, color:C.muted, marginTop:6 }}>Vyplň meno pre odoslanie</div>}

              <Glass style={{ padding:'14px 16px', marginTop:10 }}>
                <Tag text="Nacitat udaje z uzavierky Portos / plat. terminalu  · BETA" />
                <input ref={ocrInputRef} type="file" accept="image/*" capture="environment"
                  style={{ display:'none' }} onChange={handleOcrCapture} />
                <button
                  onClick={() => { if (ocrInputRef.current) ocrInputRef.current.click(); }}
                  disabled={ocrStatus === 'loading'}
                  style={{
                    width:'100%', padding:'11px', marginTop:8,
                    background: ocrStatus === 'loading' ? C.muted : C.goldDim,
                    border:`1px solid ${C.goldLine}`, color:C.gold, borderRadius:12,
                    fontWeight:700, fontSize:13,
                    cursor: ocrStatus === 'loading' ? 'default' : 'pointer',
                    fontFamily:'inherit',
                  }}>
                  {ocrStatus === 'loading' ? 'Rozpoznavam text...' : 'Nafotit blocek'}
                </button>
                {ocrImage && (
                  <img src={ocrImage} alt="" style={{ width:'100%', marginTop:8, borderRadius:8, maxHeight:180, objectFit:'contain' }} />
                )}
                {ocrStatus === 'done' && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ textAlign:'center', fontSize:12, color:C.ok, fontWeight:700 }}>
                      {ocrFilledCount > 0 ? `Vyplnilo sa ${ocrFilledCount} pol${ocrFilledCount === 1 ? 'e' : ocrFilledCount < 5 ? 'ia' : 'i'}` : 'Text rozpoznany, zhoda nenajdena'}
                    </div>
                    {ocrRawText && (
                      <details style={{ marginTop:8 }}>
                        <summary style={{ fontSize:11, color:C.muted, cursor:'pointer' }}>Rozpoznany text (klikni na detail)</summary>
                        <pre style={{ fontSize:10, color:C.sub, background:'rgba(0,0,0,0.04)', borderRadius:8, padding:8, marginTop:6, whiteSpace:'pre-wrap', wordBreak:'break-word', maxHeight:200, overflowY:'auto', lineHeight:1.5 }}>{ocrRawText}</pre>
                      </details>
                    )}
                  </div>
                )}
                {ocrStatus === 'error' && (
                  <div style={{ textAlign:'center', marginTop:6, fontSize:12, color:C.err }}>Chyba rozpoznavania — skus znova</div>
                )}
              </Glass>
            </>
          );
        })()}

        {/* ── ALKOHOL ──────────────────────────────────────────────────────── */}
        {tab === 'alkohol' && (
          <div onPointerDown={e => { if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } }}>
            {/* Meno zodpovednej osoby */}
            <Glass accent style={{ padding:'14px 16px' }}>
              <Tag text="Zodpovedná osoba" />
              <Inp type="text" placeholder="Tvoje meno…" value={alkoholAuthor}
                onChange={e => setAlkoholAuthor(e.target.value)}
                style={{ marginTop:7, borderColor: alkoholAuthor ? C.ok : C.border }} />
            </Glass>

            {/* Licencia dodávateľa */}
            <Glass style={{ padding:'14px 16px' }}>
              <Tag text="Licencia dodávateľa alkoholu" />
              {editMode ? (
                <Inp type="text" placeholder="Názov subjektu / licencie…" value={alkoholLicencia}
                  onChange={e => setAlkoholLicencia(e.target.value)}
                  style={{ marginTop:7 }} />
              ) : (
                <div style={{ marginTop:7, fontSize:14, fontWeight:600, color: alkoholLicencia ? C.text : C.muted }}>
                  {alkoholLicencia || 'Nevyplnené — zapni Editáciu nižšie a doplň'}
                </div>
              )}
            </Glass>

            {/* Denný zápis otvorených fliaš */}
            <Glass style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <Tag text="Otvorené fľaše — dnes" />
                <span style={{ fontSize:11, color:C.muted }}>
                  {now.toLocaleDateString('sk-SK', { weekday:'long', day:'numeric', month:'long' })}
                </span>
              </div>

              {alkoholKatalog.length === 0 ? (
                <div style={{ textAlign:'center', color:C.muted, fontSize:13, padding:'16px 0', lineHeight:1.5 }}>
                  Zatiaľ žiadne fľaše.<br />Zapni <b>Editáciu</b> nižšie a pridaj fľaše alkoholu.
                </div>
              ) : alkoholKatalog.map((b, idx) => (
                <div key={b.id} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px', marginBottom: idx < alkoholKatalog.length-1 ? 8 : 0,
                  borderRadius:12, background: idx % 2 === 1 ? 'rgba(150,120,80,0.07)' : 'rgba(255,255,255,0.5)',
                  border:`1px solid ${C.border}`,
                }}>
                  {editMode && <span onClick={() => removeAlkoholBottle(b.id)}
                    style={{ display:'inline-flex', alignItems:'center', color:C.err, fontSize:11, cursor:'pointer', lineHeight:1, flexShrink:0,
                             padding:'4px 7px', borderRadius:8, background:C.errDim, border:`1px solid ${C.err}33`, fontWeight:700 }}>✕</span>}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.name}</div>
                    <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>
                      {b.type && <span style={{ color:C.gold, fontWeight:600 }}>{b.type}</span>}
                      {b.type && b.ean && ' · '}
                      {b.ean && <span>EAN {b.ean}</span>}
                      {!b.type && !b.ean && <span style={{ fontStyle:'italic' }}>bez typu/EAN</span>}
                    </div>
                  </div>
                  {/* Počet otvorených fliaš — tap otvorí numpad */}
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                    <div
                      onPointerDown={e => { tapStartRef.current = { x: e.clientX, y: e.clientY }; }}
                      onPointerUp={e => { if (Math.abs(e.clientX - tapStartRef.current.x) + Math.abs(e.clientY - tapStartRef.current.y) < 10) setInvNumpad({ kind:'alkohol', rowId: b.id, value: (alkoholDnes[b.id] || '').toString(), unit: 'ks', itemName: b.name }); }}
                      style={{
                        width:64, padding:'9px 8px', borderRadius:12, boxSizing:'border-box',
                        border:`1px solid ${alkoholDnes[b.id] ? C.goldLine : C.border}`,
                        background: alkoholDnes[b.id] ? C.goldDim : 'rgba(255,255,255,0.85)',
                        color: alkoholDnes[b.id] ? C.gold : C.muted,
                        fontSize:16, fontWeight:800, textAlign:'center',
                        touchAction:'manipulation', cursor:'pointer', userSelect:'none', WebkitUserSelect:'none', WebkitTapHighlightColor:'transparent',
                        minHeight:40, display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                      {alkoholDnes[b.id] || '0'}
                    </div>
                    <span style={{ fontSize:11, color:C.muted }}>ks</span>
                  </div>
                </div>
              ))}

              {/* Info o auto-odoslaní */}
              {alkoholKatalog.length > 0 && Object.values(alkoholDnes).some(v => parseInt(v,10) > 0) && (
                <div style={{ marginTop:14, padding:'10px 14px', borderRadius:12, background:C.okDim, border:`1px solid ${C.ok}44`, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:14 }}>🌙</span>
                  <span style={{ fontSize:11, color:C.ok, fontWeight:600, lineHeight:1.4 }}>Denná evidencia sa automaticky odošle do tabuľky o polnoci</span>
                </div>
              )}
            </Glass>

            {/* Pridať fľašu — len v editačnom režime */}
            {editMode && (
              <Glass style={{ padding:'14px 16px', border:`1px dashed ${C.goldLine}` }}>
                <Tag text="Pridať fľašu alkoholu" />
                <Inp placeholder="Názov (napr. Vodka Finlandia)…" value={newAlkName} onChange={e => setNewAlkName(e.target.value)} style={{ marginTop:8, marginBottom:8 }} />
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <Inp placeholder="Typ (vodka…)" value={newAlkType} onChange={e => setNewAlkType(e.target.value)} style={{ flex:1, fontSize:13 }} />
                  <Inp placeholder="EAN kód" value={newAlkEan} onChange={e => setNewAlkEan(e.target.value)} inputMode="numeric" style={{ flex:1, fontSize:13 }} />
                </div>
                <button onClick={addAlkoholBottle} style={{ width:'100%', padding:'11px', background:C.panel, border:`1px solid ${C.border}`, color:C.text, borderRadius:12, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  + Pridať fľašu
                </button>
              </Glass>
            )}

            {/* Editačný prepínač */}
            <div onClick={() => setConfirmEditMode(true)}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginTop:6,
                       padding:'12px', borderRadius:14, cursor:'pointer', userSelect:'none',
                       border:`1px solid ${editMode ? C.goldLine : C.border}`,
                       background: editMode ? C.goldDim : 'transparent' }}>
              <span style={{ fontSize:13, fontWeight:700, letterSpacing:.5, color: editMode ? C.gold : C.muted }}>
                {editMode ? '🔓 Editácia zapnutá' : '🔒 Editácia (upraviť fľaše / licenciu)'}
              </span>
              <div style={{ width:38, height:22, borderRadius:11, padding:2, transition:'background .2s',
                            background: editMode ? C.gold : 'rgba(150,120,80,0.25)', flexShrink:0 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', transition:'transform .2s',
                              transform: editMode ? 'translateX(16px)' : 'translateX(0)',
                              boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FLOATING NAV ──────────────────────────────────────────────────────── */}
      <nav style={{
        position:'fixed', bottom: isTablet ? 24 : 18, left:'50%', transform:'translateX(-50%)',
        width: isTablet ? '70%' : '88%', maxWidth: isTablet ? 560 : 390,
        background:'rgba(255,255,255,0.92)',
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        border:`1px solid ${C.border}`,
        borderRadius:50, height: isTablet ? 70 : 62,
        display:'flex', alignItems:'center',
        boxShadow:'0 8px 32px rgba(0,0,0,.10), 0 0 0 1px rgba(150,120,80,.12)',
        zIndex:100,
      }}>
        {[
          { id:'tasks',     emoji:'✅',  label:'Úlohy' },
          { id:'temps',     emoji:'🌡️',  label:'Teploty' },
          { id:'alkohol',   emoji:'🥃',  label:'Alkohol' },
          { id:'odpisy',    emoji:'📝',  label:'Odpisy' },
          { id:'uzavierka', emoji:'🧾',  label:'Uzávierka' },
          { id:'inventory', emoji:'📦',  label:'Sklad' },
          { id:'notes',     emoji:'💬',  label:'Správy' },
        ].map(({ id, emoji, label }) => {
          const hasAlert = id === 'temps' && (lastHaccpDate !== new Date().toDateString() || lastHaccpDateVecerne !== new Date().toDateString());
          const active = tab === id;
          return (
            <div key={id} onClick={() => setTab(id)} style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              cursor:'pointer', gap:3, position:'relative', padding:'6px 4px',
            }}>
              {active && (
                <div style={{ position:'absolute', inset:'4px 6px', background:C.goldDim, borderRadius:12 }} />
              )}
              <div style={{ position:'relative', fontSize: isTablet ? 24 : 20, zIndex:1, transition:'transform .15s', transform: active ? 'scale(1.12)' : 'scale(1)' }}>
                {emoji}
                {hasAlert && <div className="dot-pulse-red" style={{ position:'absolute', top:-2, right:-4, width:7, height:7, borderRadius:'50%', background:C.err, color:C.err, boxShadow:`0 0 6px ${C.err}` }} />}
              </div>
              <div style={{ fontSize: isTablet ? 11 : 9, fontWeight: active ? 700 : 500, letterSpacing:.3, color: active ? C.gold : C.muted, transition:'color .15s', zIndex:1 }}>{label}</div>
            </div>
          );
        })}
      </nav>

      {/* ── CELEBRATION HACCP ────────────────────────────────────────────────── */}
      {celebrateHaccp && (
        <div onClick={() => setCelebrateHaccp(false)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.96)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:3000, cursor:'pointer', padding:32 }}>
          <style>{`
            @keyframes pop  { 0%{transform:scale(.4);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
            @keyframes fall { 0%{transform:translateY(-20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
            .conf-ring { animation: pop .5s cubic-bezier(.17,.67,.38,1.4) both; }
            .conf-text { animation: fall .4s .35s ease both; }
          `}</style>
          <div className="conf-ring" style={{ width:110, height:110, borderRadius:'50%', border:`3px solid ${C.ok}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 40px ${C.ok}55, 0 0 80px ${C.ok}22`, marginBottom:28 }}>
            <span style={{ fontSize:52 }}>🌡️</span>
          </div>
          <div className="conf-text" style={{ fontSize:26, fontWeight:900, color:C.text, letterSpacing:2, marginBottom:8 }}>Hotovo!</div>
          <div className="conf-text" style={{ fontSize:14, color:C.ok, fontWeight:600, marginBottom:16 }}>Na dnes je všetko zaznamenané</div>
          <div className="conf-text" style={{ fontSize:13, color:C.sub, textAlign:'center', lineHeight:1.7, background:'rgba(255,255,255,0.70)', borderRadius:14, padding:'12px 18px', border:`1px solid ${C.border}` }}>
            🌙 Polia zostanú uzamknuté do polnoci.<br />
            <span style={{ fontSize:11, color:C.muted }}>O polnoci sa automaticky odomknú pre nový záznam.</span>
          </div>
          <div className="conf-text" style={{ fontSize:11, color:C.muted, marginTop:20 }}>Klepni kdekoľvek pre pokračovanie</div>
        </div>
      )}

      {/* ── CELEBRATION ──────────────────────────────────────────────────────── */}
      {celebrate && (
        <div onClick={() => setCelebrate(false)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.96)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:3000, cursor:'pointer', padding:32 }}>
          <style>{`
            @keyframes pop  { 0%{transform:scale(.4);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
            @keyframes fall { 0%{transform:translateY(-20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
            .conf-ring { animation: pop .5s cubic-bezier(.17,.67,.38,1.4) both; }
            .conf-text { animation: fall .4s .35s ease both; }
          `}</style>
          <div className="conf-ring" style={{ width:110, height:110, borderRadius:'50%', border:`3px solid ${C.ok}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 40px ${C.ok}55, 0 0 80px ${C.ok}22`, marginBottom:28 }}>
            <span style={{ fontSize:52 }}>🎉</span>
          </div>
          <div className="conf-text" style={{ fontSize:26, fontWeight:900, color:C.text, letterSpacing:2, marginBottom:8 }}>Hotovo!</div>
          <div className="conf-text" style={{ fontSize:14, color:C.ok, fontWeight:600, marginBottom:16 }}>Všetky úlohy sú splnené</div>
          {subTab === 'denné' ? (
            <div className="conf-text" style={{ fontSize:13, color:C.sub, textAlign:'center', lineHeight:1.7, background:'rgba(255,255,255,0.70)', borderRadius:14, padding:'12px 18px', border:`1px solid ${C.border}` }}>
              🌙 Denný zoznam sa automaticky resetuje<br />
              <span style={{ color:C.gold, fontWeight:700 }}>o polnoci</span> — nie je potrebný manuálny reset.<br />
              <span style={{ fontSize:11, color:C.muted }}>Ak chcete odoslať súhrn skôr, použite Resetovať zoznam.</span>
            </div>
          ) : (
            <div className="conf-text" style={{ fontSize:13, color:C.sub, textAlign:'center', lineHeight:1.7, background:'rgba(255,255,255,0.70)', borderRadius:14, padding:'12px 18px', border:`1px solid ${C.border}` }}>
              ♻️ Pre začatie nového cyklu<br />
              kliknite na <span style={{ color:C.gold, fontWeight:700 }}>Resetovať zoznam</span> nižšie.<br />
              <span style={{ fontSize:11, color:C.muted }}>Úlohy ostanú viditeľné ako splnené.</span>
            </div>
          )}
          <div className="conf-text" style={{ fontSize:11, color:C.muted, marginTop:20 }}>Klepni kdekoľvek pre pokračovanie</div>
        </div>
      )}

      {/* ── CONFIRM UNDO ─────────────────────────────────────────────────────── */}
      {confirmUndo && (
        <div onMouseDown={() => setConfirmUndo(null)} style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.12)' }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:14 }}>↩️</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:8 }}>Zrušiť splnenie?</div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:24, lineHeight:1.5 }}>
              Úloha <span style={{ color:C.gold, fontWeight:600 }}>„{confirmUndo.text}"</span> bude označená ako nesplnená.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onMouseDown={() => setConfirmUndo(null)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Ponechať
              </button>
              <button onMouseDown={() => uncheckedTask(confirmUndo)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.err}44`, background:C.errDim, color:C.err, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Zrušiť splnenie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM EXPORT PDF (odpisy) ──────────────────────────────────────── */}
      {confirmExportPdf && (
        <div onMouseDown={() => setConfirmExportPdf(false)} style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', maxWidth:360, borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.12)' }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:14 }}>📄</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:8 }}>Exportovať do PDF?</div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:24, lineHeight:1.5 }}>
              Otvorí sa dokument s mesačným súhrnom odpisov pripravený na tlač.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onMouseDown={() => setConfirmExportPdf(false)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Zrušiť
              </button>
              <button onMouseDown={() => { setConfirmExportPdf(false); exportOdpisyPDF(); }} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.goldLine}`, background:C.goldDim, color:C.gold, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Áno, exportovať
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE TASK ──────────────────────────────────────────────── */}
      {confirmDeleteTask && (
        <div onMouseDown={() => setConfirmDeleteTask(null)} style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', maxWidth:360, borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.12)' }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:14 }}>🗑️</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:8 }}>Zmazať úlohu?</div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:24, lineHeight:1.5 }}>
              Úloha <span style={{ color:C.gold, fontWeight:600 }}>„{confirmDeleteTask.text}"</span> bude natrvalo odstránená zo zoznamu.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onMouseDown={() => setConfirmDeleteTask(null)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Ponechať
              </button>
              <button onMouseDown={() => {
                setTasks({ ...tasks, [subTab]: tasks[subTab].filter(x => x.id !== confirmDeleteTask.id) });
                setConfirmDeleteTask(null);
              }} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.err}44`, background:C.errDim, color:C.err, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Áno, zmazať
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM RESET HACCP ──────────────────────────────────────────────── */}
      {confirmResetHaccp && (
        <div onMouseDown={() => setConfirmResetHaccp(false)} style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.12)' }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:14 }}>🌙</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:10 }}>Resetovať teplotný záznam?</div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:24, lineHeight:1.7 }}>
              Upozornenie: záznam sa resetuje <span style={{ color:C.gold, fontWeight:700 }}>automaticky každú polnoc</span>.<br />
              Manuálny reset použite len ak bol záznam zadaný omylom.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onMouseDown={() => setConfirmResetHaccp(false)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Zrušiť</button>
              <button onMouseDown={() => {
                if (haccpShift === 'ranné') {
                  setLastHaccpDate('');
                  setTemps(tempFields.reduce((a, f) => ({ ...a, [f.key]: '' }), {}));
                  localStorage.setItem('foxford-haccp-date', '');
                } else {
                  setLastHaccpDateVecerne('');
                  setTempsVecerne(tempFields.reduce((a, f) => ({ ...a, [f.key]: '' }), {}));
                  localStorage.setItem('foxford-haccp-date-vecerne', '');
                }
                setControllerName('');
                setConfirmResetHaccp(false);
              }} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.err}44`, background:C.errDim, color:C.err, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Áno, resetovať</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM ADD TEMP DEVICE ──────────────────────────────────────────── */}
      {confirmAddTemp && (
        <div onMouseDown={() => setConfirmAddTemp(false)} style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.12)' }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:14 }}>🌡️</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:10 }}>Pridať nové zariadenie?</div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:24, lineHeight:1.6 }}>
              Chcete pridať nové zariadenie do teplotnej kontroly?
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onMouseDown={() => setConfirmAddTemp(false)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Zrušiť</button>
              <button onMouseDown={() => { setConfirmAddTemp(false); setShowAddTemp(true); }} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.goldLine}`, background:C.goldDim, color:C.gold, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Áno, pridať</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM REMOVE TEMP DEVICE ───────────────────────────────────────── */}
      {confirmRemoveTemp && (
        <div onMouseDown={() => setConfirmRemoveTemp(null)} style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.12)' }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:14 }}>🗑️</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:10 }}>Odstrániť zariadenie?</div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:24, lineHeight:1.6 }}>
              Zariadenie <span style={{ color:C.gold, fontWeight:700 }}>„{confirmRemoveTemp.label}"</span> bude odstránené zo zoznamu.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onMouseDown={() => setConfirmRemoveTemp(null)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Zrušiť</button>
              <button onMouseDown={() => {
                setTempFields(prev => prev.filter(f => f.key !== confirmRemoveTemp.key));
                setTemps(prev => { const n = { ...prev }; delete n[confirmRemoveTemp.key]; return n; });
                setTempsVecerne(prev => { const n = { ...prev }; delete n[confirmRemoveTemp.key]; return n; });
                setConfirmRemoveTemp(null);
              }} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.err}44`, background:C.errDim, color:C.err, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Áno, odstrániť</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM RESET ────────────────────────────────────────────────────── */}
      {confirmReset && (
        <div onMouseDown={() => setConfirmReset(false)} style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.12)' }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:14 }}>⚠️</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:10 }}>Resetovať zoznam?</div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', lineHeight:1.65, marginBottom:24, padding:'0 4px' }}>
              Reset zoznamu sa robí <span style={{ color:C.gold, fontWeight:700 }}>iba na konci pracovného dňa</span>. Všetky splnené úlohy budú vymazané. Si si istý/á?
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onMouseDown={() => setConfirmReset(false)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Zrušiť
              </button>
              <button onMouseDown={doReset} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.err}44`, background:C.errDim, color:C.err, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Áno, resetovať
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOCKED ALERT — pop-up keď user klikne na uzamknuté teplotné pole ─ */}
      {lockedAlert && (
        <div onPointerDown={() => setLockedAlert(null)}
          style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3500, padding:24 }}>
          <div onPointerDown={e => e.stopPropagation()}
            className="sheet-bounce"
            style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', maxWidth:360, borderRadius:24, padding:'28px 22px 22px', boxShadow:'0 12px 48px rgba(0,0,0,.18)' }}>
            <div style={{ fontSize:40, textAlign:'center', marginBottom:12 }}>🔒</div>
            <div style={{ fontSize:17, fontWeight:800, color:C.text, textAlign:'center', marginBottom:10 }}>
              {lockedAlert.shift === 'ranné' ? 'Ranná' : 'Večerná'} kontrola je už zaznamenaná
            </div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:22, lineHeight:1.6 }}>
              Teplotné polia sú uzamknuté.<br />
              Automaticky sa odomknú <span style={{ color:C.gold, fontWeight:700 }}>o polnoci</span>.
            </div>
            <button onClick={() => setLockedAlert(null)}
              style={{ width:'100%', padding:'13px', borderRadius:14, border:`1px solid ${C.goldLine}`, background:C.goldDim, color:C.gold, fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit', letterSpacing:.5 }}>
              Rozumiem
            </button>
          </div>
        </div>
      )}

      {/* ── INVENTORY NUMPAD MODAL ───────────────────────────────────────────── */}
      {invNumpad && (
        <div style={{ position:'fixed', inset:0, zIndex:3500 }}>
          {/* Blur vrstva — samostatný sibling bez detí: písanie do numpadu ju neinvaliduje,
              takže prehliadač neprepočítava celoobrazovkový blur na každé ťuknutie => plynulé */}
          <div onPointerDown={numpadCancel}
            style={{ position:'absolute', inset:0, background:'rgba(30,22,8,.55)',
                     backdropFilter:'blur(5px)', WebkitBackdropFilter:'blur(5px)' }} />
          {/* Obsah nad blur vrstvou */}
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', padding:24, pointerEvents:'none' }}>
          <div onPointerDown={e => e.stopPropagation()} className="pop-in"
            style={{ pointerEvents:'auto', background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', maxWidth:340,
                     borderRadius:26, padding:'22px 18px 20px', boxShadow:'0 12px 48px rgba(0,0,0,.2)' }}>

            {/* Názov položky */}
            <div style={{ fontSize:12, fontWeight:700, color:C.sub, textAlign:'center', letterSpacing:.5, textTransform:'uppercase', marginBottom:6 }}>
              {invNumpad.itemName}
            </div>

            {/* Displej */}
            <div style={{ background:C.goldDim, border:`1.5px solid ${C.goldLine}`, borderRadius:16,
                          padding:'16px 20px', textAlign:'center', marginBottom:16, minHeight:64,
                          display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <span style={{ fontSize:42, fontWeight:800, color:C.gold, letterSpacing:1, fontVariantNumeric:'tabular-nums' }}>
                {invNumpad.value || '0'}
              </span>
              <span style={{ fontSize:16, color:C.sub, fontWeight:600 }}>{invNumpad.unit}</span>
            </div>

            {/* Numpad mriežka */}
            {[['7','8','9'],['4','5','6'],['1','2','3'],['.','0','⌫']].map((row, ri) => (
              <div key={ri} style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:8 }}>
                {row.map(key => (
                  <button key={key} onPointerDown={e => { e.preventDefault(); numpadPress(key); }}
                    style={{
                      padding:'18px 0', borderRadius:14, fontSize:22, fontWeight:700,
                      border:`1px solid ${key === '⌫' ? C.errDim : C.border}`,
                      background: key === '⌫' ? C.errDim : 'rgba(255,255,255,0.9)',
                      color: key === '⌫' ? C.err : C.text,
                      cursor:'pointer', fontFamily:'inherit',
                      WebkitTapHighlightColor:'transparent',
                      boxShadow:'0 2px 6px rgba(0,0,0,0.06)',
                      transition:'transform .08s, background .1s',
                      userSelect:'none',
                    }}>
                    {key}
                  </button>
                ))}
              </div>
            ))}

            {/* ± prepínač — teploty (mrazák) a uzávierka len pole L (zaokrúhlenie môže byť záporné) */}
            {(invNumpad.kind === 'temp' || (invNumpad.kind === 'uzavierka' && invNumpad.fieldKey === 'L')) && (
              <button onPointerDown={e => { e.preventDefault(); numpadPress('±'); }}
                style={{ width:'100%', padding:'14px 0', borderRadius:14, fontSize:18, fontWeight:700,
                         border:`1px solid ${C.border}`, background:'rgba(255,255,255,0.9)', color:C.text,
                         cursor:'pointer', fontFamily:'inherit', WebkitTapHighlightColor:'transparent',
                         boxShadow:'0 2px 6px rgba(0,0,0,0.06)', userSelect:'none', marginBottom:8 }}>
                ± plus / mínus
              </button>
            )}

            {/* Confirm + Cancel */}
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button onPointerDown={e => { e.preventDefault(); numpadCancel(); }}
                style={{ flex:1, padding:'14px', borderRadius:14, border:`1px solid ${C.border}`,
                         background:'transparent', color:C.sub, fontWeight:700, fontSize:14,
                         cursor:'pointer', fontFamily:'inherit' }}>
                Zrušiť
              </button>
              <button onPointerDown={e => { e.preventDefault(); numpadConfirm(); }}
                style={{ flex:2, padding:'14px', borderRadius:14, border:`1px solid ${C.goldLine}`,
                         background:`linear-gradient(135deg, ${C.gold}, #d4903a)`,
                         color:'#fff', fontWeight:800, fontSize:16,
                         cursor:'pointer', fontFamily:'inherit',
                         boxShadow:'0 4px 16px rgba(184,112,32,0.35)',
                         letterSpacing:.5 }}>
                Potvrdiť ✓
              </button>
            </div>

          </div>
          </div>
        </div>
      )}

      {/* ── ODPIS QTY WARNING — podozrivo veľké množstvo (možný omyl jednotky) ─ */}
      {qtyWarn && (
        <div onPointerDown={() => setQtyWarn(null)}
          style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
                   display:'flex', alignItems:'center', justifyContent:'center', zIndex:3600, padding:24 }}>
          <div onPointerDown={e => e.stopPropagation()} className="sheet-bounce"
            style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', maxWidth:360, borderRadius:24, padding:'28px 22px 22px', boxShadow:'0 12px 48px rgba(0,0,0,.18)' }}>
            <div style={{ fontSize:40, textAlign:'center', marginBottom:12 }}>⚠️</div>
            <div style={{ fontSize:17, fontWeight:800, color:C.text, textAlign:'center', marginBottom:10 }}>
              Naozaj odpísať <span style={{ color:C.err }}>{qtyWarn.value} {qtyWarn.unit}</span>?
            </div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:22, lineHeight:1.6 }}>
              <span style={{ fontWeight:600, color:C.text }}>{qtyWarn.itemName}</span> sa eviduje v <span style={{ color:C.gold, fontWeight:700 }}>{qtyWarn.unit}</span>.<br />
              Je to veľké množstvo — skontroluj, či si nepomýlil jednotku.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button
                onPointerDown={e => { e.preventDefault(); const w = qtyWarn; setQtyWarn(null); setInvNumpad({ kind:'odpis', itemId: w.itemId, rowId: w.rowId, value: w.value, unit: w.unit, itemName: w.itemName }); }}
                style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.goldLine}`, background:C.goldDim, color:C.gold, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Opraviť
              </button>
              <button
                onPointerDown={e => { e.preventDefault(); updateOdpisQty(qtyWarn.itemId, qtyWarn.rowId, qtyWarn.value); setQtyWarn(null); }}
                style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Áno, správne
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRESS RING (long-press indikátor) ───────────────────────────────── */}
      {pressingId && (
        <div className="press-ring" style={{ left: pressPos.x - 50, top: pressPos.y - 50 }}>
          <svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" /></svg>
        </div>
      )}

      {/* ── ISSUE SHEET ───────────────────────────────────────────────────────── */}
      {quickTask && (
        <div className="sheet-backdrop" onMouseDown={() => setQuickTask(null)} style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'flex-end', zIndex:2000 }}>
          <div className="sheet-bounce" onMouseDown={e => e.stopPropagation()} style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', borderTopLeftRadius:28, borderTopRightRadius:28, padding:'22px 18px 38px', boxShadow:'0 -8px 40px rgba(0,0,0,.10)' }}>
            <div style={{ width:32, height:3, background:C.muted, borderRadius:2, margin:'0 auto 20px' }} />
            <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:3 }}>Akcie pre úlohu</div>
            <div style={{ fontSize:12, color:C.sub, marginBottom:16, lineHeight:1.4 }}>{quickTask.text}</div>

            {/* Urgent toggle */}
            <button onMouseDown={e => {
              e.stopPropagation();
              setTasks({...tasks, [subTab]: tasks[subTab].map(x => x.id === quickTask.id ? {...x, urgent: !x.urgent} : x)});
              setQuickTask(null);
            }} style={{
              display:'block', width:'100%', padding:'14px 16px', marginBottom:7,
              borderRadius:14, border:`1px solid ${quickTask.urgent ? C.err+'55' : C.border}`,
              background: quickTask.urgent ? C.errDim : C.panel,
              textAlign:'left', fontSize:14, fontWeight:600,
              color: quickTask.urgent ? C.err : C.text,
              cursor:'pointer', fontFamily:'inherit',
            }}>{quickTask.urgent ? '✕ Zrušiť urgentnosť' : '⚡ Označiť ako urgentná'}</button>

            {/* Divider */}
            <div style={{ height:1, background:C.border, margin:'4px 0 10px' }} />
            <div style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Nahlásiť problém</div>

            {['Chýba tovar / pomôcky','Pokazené zariadenie','Nedostatok času'].map(r => (
              <button key={r} onMouseDown={e => reportIssue(r,e)} style={{
                display:'block', width:'100%', padding:'13px 16px', marginBottom:6,
                borderRadius:14, border:`1px solid ${C.border}`, background:C.panel,
                textAlign:'left', fontSize:14, fontWeight:500, color:C.text,
                cursor:'pointer', fontFamily:'inherit',
              }}>{r}</button>
            ))}
            <div onMouseDown={e => e.stopPropagation()} style={{ marginBottom:6 }}>
              <Inp
                placeholder="Iný dôvod — napíš popis…"
                style={{ fontSize:13, marginBottom:6 }}
                onKeyDown={e => { if(e.key==='Enter' && e.target.value.trim()) reportIssue(e.target.value.trim()); }}
              />
              <button onMouseDown={e => {
                const inp = e.currentTarget.previousSibling;
                if(inp && inp.value.trim()) reportIssue(inp.value.trim(), e);
              }} style={{
                width:'100%', padding:'11px', borderRadius:12, border:`1px solid ${C.border}`,
                background:C.panel, textAlign:'left', fontSize:13, fontWeight:600,
                color:C.sub, cursor:'pointer', fontFamily:'inherit',
              }}>Potvrdiť vlastný dôvod</button>
            </div>

            <button onMouseDown={() => setQuickTask(null)} style={{ display:'block', width:'100%', padding:'12px', marginTop:8, background:'none', border:'none', color:C.muted, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Zrušiť</button>
          </div>
        </div>
      )}

      {/* ── ADD ITEM MODAL ────────────────────────────────────────────────────── */}
      {addingTo && (
        <div onMouseDown={() => setAddingTo(null)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:20 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'24px 20px' }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:18 }}>
              Pridať do: <span style={{ color:C.gold }}>{addingTo}</span>
            </div>
            <Inp placeholder="Názov položky…" value={newItemName} onChange={e => setNewItemName(e.target.value)} style={{ marginBottom:10 }} />
            <Inp placeholder="Jednotka (ks, kg, bal…)" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} style={{ marginBottom:10 }} />
            <Inp placeholder="PORTOS kód (napr. 7)" value={newItemCode} onChange={e => setNewItemCode(e.target.value)} style={{ marginBottom:20, fontSize:13 }} />
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button onClick={() => setAddingTo(null)} style={{ flex:1, padding:'13px', borderRadius:12, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Zrušiť</button>
              <button onClick={() => {
                if(newItemName.trim()){
                  setInvData(invData.map(g=>g.category===addingTo?{...g,items:[...g.items,{id:`c-${Date.now()}`,name:newItemName,unit:newItemUnit||'ks',portosCode:newItemCode.trim()}]}:g));
                  setNewItemName(''); setNewItemUnit(''); setNewItemCode('');
                }
              }} style={{ flex:1, padding:'13px', borderRadius:12, background:'transparent', border:`1px solid ${C.goldLine}`, color:C.gold, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
                + Ďalšia
              </button>
              <button onClick={() => {
                if(newItemName.trim()){
                  setInvData(invData.map(g=>g.category===addingTo?{...g,items:[...g.items,{id:`c-${Date.now()}`,name:newItemName,unit:newItemUnit||'ks',portosCode:newItemCode.trim()}]}:g));
                  setNewItemName(''); setNewItemUnit(''); setNewItemCode('');
                }
                setAddingTo(null);
              }} style={{ flex:2, padding:'13px', borderRadius:12, background:C.goldDim, border:`1px solid ${C.goldLine}`, color:C.gold, fontWeight:800, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
                Pridať položku
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATION SETTINGS MODAL ─────────────────────────────────────── */}
      {showNotifModal && (
        <div onMouseDown={() => setShowNotifModal(false)} style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.12)' }}>
            <div style={{ fontSize:30, textAlign:'center', marginBottom:10 }}>🔔</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:4 }}>Notifikácie</div>
            <div style={{ fontSize:12, color:C.sub, textAlign:'center', marginBottom:22, lineHeight:1.5 }}>Pripomienky na denné úlohy</div>

            {notifPermission === 'unsupported' && (
              <div style={{ padding:'12px 14px', borderRadius:12, background:C.errDim, border:`1px solid ${C.err}33`, fontSize:12, color:C.err, marginBottom:16, textAlign:'center', lineHeight:1.5 }}>
                Tvoj prehliadač nepodporuje notifikácie.
              </div>
            )}

            {notifPermission === 'denied' && (
              <div style={{ padding:'12px 14px', borderRadius:12, background:C.errDim, border:`1px solid ${C.err}33`, fontSize:12, color:C.err, marginBottom:16, textAlign:'center', lineHeight:1.6 }}>
                Notifikácie sú zablokované v prehliadači.<br />
                <span style={{ color:C.muted }}>Odblokuj ich manuálne v nastaveniach zariadenia.</span>
              </div>
            )}

            {notifPermission === 'default' && (
              <button onClick={requestNotifPermission} style={{ width:'100%', padding:'14px', borderRadius:14, background:C.goldDim, border:`1px solid ${C.goldLine}`, color:C.gold, fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit', marginBottom:16, letterSpacing:.3 }}>
                🔔 Povoliť notifikácie
              </button>
            )}

            {notifPermission === 'granted' && (
              <>
                {/* Toggle */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderRadius:14, border:`1px solid ${C.border}`, background:C.panel, marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Zapnúť pripomienky</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Denné úlohy a HACCP kontrola</div>
                  </div>
                  <div onClick={() => setNotifSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                    style={{ width:46, height:26, borderRadius:13, background: notifSettings.enabled ? C.ok : 'rgba(150,120,80,0.25)', position:'relative', cursor:'pointer', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ position:'absolute', top:3, left: notifSettings.enabled ? 23 : 3, width:20, height:20, borderRadius:'50%', background:'white', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'left .2s' }} />
                  </div>
                </div>

                {/* Time picker */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderRadius:14, border:`1px solid ${C.border}`, background:C.panel, marginBottom:10, opacity: notifSettings.enabled ? 1 : 0.45, transition:'opacity .2s' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Čas pripomienky</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Každý deň o tomto čase</div>
                  </div>
                  <input type="time" value={notifSettings.time} disabled={!notifSettings.enabled}
                    onChange={e => setNotifSettings(prev => ({ ...prev, time: e.target.value }))}
                    style={{ fontSize:16, fontWeight:800, color:C.gold, background:'transparent', border:'none', outline:'none', cursor: notifSettings.enabled ? 'pointer' : 'default', fontFamily:'inherit', padding:0 }} />
                </div>

                {/* Info */}
                <div style={{ padding:'11px 14px', borderRadius:12, background:C.goldDim, border:`1px solid ${C.goldLine}`, fontSize:11, color:C.sub, lineHeight:1.6, marginBottom:14 }}>
                  💡 Notifikácia sa zobrazí ak nie sú splnené všetky denné úlohy. Funguje keď je aplikácia otvorená v prehliadači.
                </div>

                {/* Test */}
                {notifSettings.enabled && (
                  <button onClick={() => { showNotification('Foxford ☕', 'Toto je testovacia notifikácia. Všetko funguje! 🎉'); }}
                    style={{ width:'100%', padding:'12px', borderRadius:12, background:'transparent', border:`1px solid ${C.border}`, color:C.sub, fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', marginBottom:10 }}>
                    🧪 Otestovať notifikáciu
                  </button>
                )}
              </>
            )}

            <button onClick={() => setShowNotifModal(false)} style={{ width:'100%', padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', marginTop:4 }}>
              Zavrieť
            </button>
          </div>
        </div>
      )}

      {/* ── BUG REPORT MODAL ─────────────────────────────────────────────────── */}
      {showBugModal && (
        <div onMouseDown={() => setShowBugModal(false)} style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', maxWidth:460, borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.12)' }}>
            {bugSent ? (
              <>
                <div style={{ fontSize:40, textAlign:'center', marginBottom:14 }}>✅</div>
                <div style={{ fontSize:17, fontWeight:900, color:C.text, textAlign:'center', marginBottom:8 }}>Ďakujeme!</div>
                <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:24, lineHeight:1.6 }}>
                  Chyba bola odoslaná. Pozrieme sa na to čo najskôr.
                </div>
                <button onClick={() => setShowBugModal(false)} style={{ width:'100%', padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  Zavrieť
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize:30, textAlign:'center', marginBottom:10 }}>🐛</div>
                <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:4 }}>Nahlásiť chybu</div>
                <div style={{ fontSize:12, color:C.sub, textAlign:'center', marginBottom:20, lineHeight:1.5 }}>
                  Niečo nefunguje? Popíš problém a my sa na to pozrieme.
                </div>

                <div style={{ fontSize:11, fontWeight:700, color:C.sub, letterSpacing:.5, textTransform:'uppercase', marginBottom:6 }}>Tvoje meno (voliteľné)</div>
                <Inp placeholder="Meno alebo prezývka…" value={bugAuthor} onChange={e => setBugAuthor(e.target.value)}
                  style={{ marginBottom:14 }} />

                <div style={{ fontSize:11, fontWeight:700, color:C.sub, letterSpacing:.5, textTransform:'uppercase', marginBottom:6 }}>Popis problému</div>
                <textarea
                  placeholder="Čo sa stalo? Kde v appke? Ako to reprodukovať…"
                  value={bugText}
                  onChange={e => setBugText(e.target.value)}
                  rows={5}
                  style={{
                    width:'100%', padding:'12px 14px', borderRadius:12,
                    border:`1px solid ${bugText.trim() ? C.goldLine : C.border}`,
                    background:'rgba(255,255,255,0.85)', color:C.text,
                    fontSize:13, lineHeight:1.6, fontFamily:'inherit',
                    outline:'none', resize:'vertical', boxSizing:'border-box',
                    marginBottom:20,
                  }} />

                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setShowBugModal(false)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                    Zrušiť
                  </button>
                  <button onClick={() => {
                    if (!bugText.trim()) return;
                    sendToSheets('bug_report', {
                      date: new Date().toLocaleString('sk-SK'),
                      author: bugAuthor.trim() || 'Anonym',
                      branch: branch || '—',
                      description: bugText.trim(),
                      userAgent: navigator.userAgent,
                    });
                    setBugSent(true);
                  }} style={{
                    flex:2, padding:'13px', borderRadius:14,
                    border:`1px solid ${C.goldLine}`, background: bugText.trim() ? C.gold : C.goldDim,
                    color: bugText.trim() ? '#fff' : C.gold,
                    fontWeight:800, fontSize:13, cursor: bugText.trim() ? 'pointer' : 'default',
                    fontFamily:'inherit', transition:'all .2s',
                  }}>
                    Odoslať
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── PIN MODAL ─────────────────────────────────────────────────────────── */}
      {pinStep && (
        <div style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:4000, padding:24 }}>
          <div style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'28px 20px', textAlign:'center' }}>
            <div style={{ fontSize:20, marginBottom:8 }}>🔒</div>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:4 }}>Zadaj PIN</div>
            <div style={{ fontSize:12, color:C.sub, marginBottom:20 }}>Pre zmenu prevádzky je potrebný manažérsky PIN.</div>
            <input type="password" inputMode="numeric" maxLength={4} value={pinInput}
              onChange={e => { setPinInput(e.target.value); setPinError(false); }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (pinInput === BRANCH_PIN) { setPinStep(false); setShowBranchSelect(true); setPinInput(''); }
                  else { setPinError(true); setPinInput(''); }
                }
              }}
              autoFocus
              style={{ width:'100%', padding:'14px', borderRadius:12, border:`1px solid ${pinError ? C.err : C.border}`, background:'rgba(255,255,255,0.85)', color:C.text, fontSize:22, outline:'none', fontFamily:'inherit', textAlign:'center', letterSpacing:8, boxSizing:'border-box' }}
              placeholder="••••" />
            {pinError && <div style={{ fontSize:12, color:C.err, marginTop:8 }}>Nesprávny PIN</div>}
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button onClick={() => { setPinStep(false); setPinInput(''); }} style={{ flex:1, padding:'13px', borderRadius:12, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Zrušiť</button>
              <button onClick={() => {
                if (pinInput === BRANCH_PIN) { setPinStep(false); setShowBranchSelect(true); setPinInput(''); }
                else { setPinError(true); setPinInput(''); }
              }} style={{ flex:2, padding:'13px', borderRadius:12, background:C.goldDim, border:`1px solid ${C.goldLine}`, color:C.gold, fontWeight:800, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Potvrdiť</button>
            </div>
          </div>
        </div>
      )}

      {/* ── BRANCH SELECT MODAL ───────────────────────────────────────────────── */}
      {showBranchSelect && (
        <div style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.95)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:4000, padding:24 }}>
          <div style={{ width:'100%', maxWidth:460 }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:4, textAlign:'center' }}>Vyber prevádzku</div>
            <div style={{ fontSize:12, color:C.sub, marginBottom:20, textAlign:'center' }}>Aktuálna: <span style={{ color:C.gold }}>{branch}</span></div>
            {BRANCHES.map(b => (
              <button key={b.name} onClick={() => { localStorage.setItem('foxford-branch', b.name); setBranch(b.name); setShowBranchSelect(false); }}
                style={{ width:'100%', padding:'15px 16px', marginBottom:8, borderRadius:14, border:`1px solid ${b.name === branch ? C.goldLine : C.border}`, background: b.name === branch ? C.goldDim : C.panel, color: b.name === branch ? C.gold : C.text, fontSize:14, fontWeight: b.name === branch ? 700 : 500, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                🏪 {b.name}
              </button>
            ))}
            <button onClick={() => setShowBranchSelect(false)} style={{ width:'100%', padding:'13px', marginTop:4, borderRadius:12, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Zrušiť</button>
          </div>
        </div>
      )}

      {/* ── MISSING QTY WARNING ───────────────────────────────────────────────── */}
      {missingWarning.length > 0 && (
        <div style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2500, padding:20 }}>
          <div style={{ background:C.modal, border:`1px solid ${C.errDim}`, width:'100%', borderRadius:24, padding:'24px 20px' }}>
            <div style={{ fontSize:18, marginBottom:8 }}>⚠️</div>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:6 }}>Chýbajú množstvá</div>
            <div style={{ fontSize:12, color:C.sub, marginBottom:14 }}>Tieto položky nemajú vyplnené množstvo:</div>
            <div style={{ marginBottom:18, maxHeight:160, overflowY:'auto' }}>
              {missingWarning.map(item => (
                <div key={item.id} style={{ fontSize:12, color:C.err, padding:'4px 0', borderBottom:`1px solid ${C.border}` }}>• {item.name}</div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setMissingWarning([])} style={{ flex:1, padding:'13px', borderRadius:12, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Späť</button>
              <button onClick={() => {
                if (!needName()) { setMissingWarning([]); return; }
                setMissingWarning([]);
                const allItems = invData.flatMap(g => g.items).filter(item => (invQty[item.id]||[]).some(r => r.qty));
                const _invTabName2 = `${selectedMonth} ${new Date().getFullYear()} — ${new Date().toLocaleTimeString('sk-SK', { hour:'2-digit', minute:'2-digit' })}`;
                sendToSheets('inventory', {
                  date: new Date().toLocaleDateString('sk-SK'),
                  month: _invTabName2,
                  inspector: controllerName || 'Anonym',
                  items: allItems.map(item => {
                    const rows = (invQty[item.id]||[]).filter(r => r.qty);
                    const breakdown = rows.map(r => r.label ? `${r.label}: ${r.qty}` : r.qty).join(' + ');
                    return { name: item.name, unit: item.unit, qty: qtyTotal(item.id), breakdown, note: invNotes[item.id] || '' };
                  }),
                });
                setSuccess(true);
              }} style={{ flex:2, padding:'13px', borderRadius:12, background:C.goldDim, border:`1px solid ${C.goldLine}`, color:C.gold, fontWeight:800, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
                Odoslať aj tak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM EDIT MODE ────────────────────────────────────────────────── */}
      {confirmEditMode && (
        <div onMouseDown={() => setConfirmEditMode(false)} style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', maxWidth:360, borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.12)' }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:14 }}>{editMode ? '🔒' : '🔓'}</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:8 }}>
              {editMode ? 'Vypnúť editáciu?' : 'Zapnúť editáciu?'}
            </div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:24, lineHeight:1.5 }}>
              {editMode ? 'Editačný režim sa vypne a zmeny zostanú uložené.' : 'Editačný režim umožňuje pridávať a mazať položky.'}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onMouseDown={() => setConfirmEditMode(false)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Zrušiť
              </button>
              <button onMouseDown={() => { setEditMode(v => !v); setConfirmEditMode(false); }} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.goldLine}`, background:C.goldDim, color:C.gold, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Áno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS ───────────────────────────────────────────────────────────── */}
      {success && (
        <div onClick={() => setSuccess(false)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.97)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:3000, cursor:'pointer', overflow:'hidden' }}>
          {/* confetti particles */}
          {Array.from({length:30}).map((_,i) => (
            <div key={i} style={{
              position:'absolute',
              left: `${Math.random()*100}%`,
              top: '-20px',
              width: 8, height: 8,
              borderRadius: i%3===0 ? '50%' : 2,
              background: ['#e0a03a','#4caf50','#2196f3','#e91e63','#ff9800'][i%5],
              animation: `confettiFall ${1.5+Math.random()*2}s ${Math.random()*1}s ease-in forwards`,
              transform: `rotate(${Math.random()*360}deg)`,
            }} />
          ))}
          <style>{`
            @keyframes confettiFall {
              0%   { transform: translateY(0) rotate(0deg); opacity:1; }
              100% { transform: translateY(110vh) rotate(720deg); opacity:0; }
            }
            @keyframes popIn {
              0%   { transform: scale(0.3); opacity:0; }
              70%  { transform: scale(1.15); }
              100% { transform: scale(1); opacity:1; }
            }
          `}</style>
          <div style={{ animation:'popIn 0.5s ease forwards', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ fontSize:60, marginBottom:10 }}>🎉</div>
            <div style={{ width:80, height:80, borderRadius:'50%', background:C.okDim, border:`2px solid ${C.ok}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, marginBottom:20, boxShadow:`0 0 30px ${C.ok}55` }}>✓</div>
            <div style={{ fontSize:22, fontWeight:900, color:C.text, letterSpacing:3 }}>
              {success === 'uzavierka' ? 'UZÁVIERKA ODOSLANÁ!' : 'INVENTÚRA ODOSLANÁ!'}
            </div>
            <div style={{ marginTop:12, color:C.sub, fontSize:13, textAlign:'center', maxWidth:280, lineHeight:1.6 }}>
              {success === 'uzavierka'
                ? 'Záznam je uložený. O polnoci sa formulár vynuluje a ráno sa nad poľom A zobrazí tento zostatok na overenie pri prerátaní.'
                : 'Údaje zostávajú zapísané až do začatia novej inventúry.'}
            </div>
            <div style={{ marginTop:24, color:C.muted, fontSize:11 }}>klikni kdekoľvek pre zatvorenie</div>
          </div>
        </div>
      )}
    </div>
  );
}
