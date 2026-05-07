import React, { useState, useEffect, useRef } from 'react';

// ── LIGHT WARM PALETTE ───────────────────────────────────────────────────────
const BASE_C = {
  bg:       '#f2ede4',
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

const INIT_TASKS = {
  denné: [
    { id: 101, text: 'Sanitácia dýz kávovaru',      done: false, time: null, issue: null },
    { id: 102, text: 'Čistenie mlynčekov',           done: false, time: null, issue: null },
    { id: 103, text: 'Vyliatie misky pod kávovarom', done: false, time: null, issue: null },
  ],
  víkendové: [{ id: 201, text: 'Odvápnenie kanvice',     done: false, time: null, issue: null }],
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

const INIT_TEMP_FIELDS = [
  { key: 'vitrina',    label: 'Vitrína',    max: '≤ 8 °C' },
  { key: 'chladnicka', label: 'Chladnička', max: '≤ 5 °C' },
  { key: 'sklad',      label: 'Sklad',      max: '≤ 25 °C' },
];

const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

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
  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.2, color: BASE_C.sub }}>{text}</span>
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

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading]   = useState(true);
  const [online, setOnline]     = useState(navigator.onLine);
  const [tab, setTab]           = useState('tasks');
  const [subTab, setSubTab]     = useState('denné');
  const [expCat, setExpCat]     = useState(null);
  const [quickTask, setQuickTask] = useState(null);
  const [confirmUndo, setConfirmUndo] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [lastHaccpDate, setLastHaccpDate] = useState(localStorage.getItem('foxford-haccp-date') || '');
  const [invSearch, setInvSearch] = useState('');

  const timerRef = useRef(null);
  const longPress  = useRef(false);
  const inspRef  = useRef(null);
  const nameRef  = useRef(null);
  const touchX   = useRef(null);
  const [swipeId,  setSwipeId]  = useState(null);
  const [swipeOff, setSwipeOff] = useState(0);

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('foxford-tasks');
    const last  = localStorage.getItem('foxford-last-reset-date');
    const today = new Date().toDateString();
    if (!saved) return INIT_TASKS;
    const parsed = JSON.parse(saved);
    if (last !== today) {
      localStorage.setItem('foxford-last-reset-date', today);
      localStorage.setItem('foxford-batch', '');
      return { ...parsed, denné: INIT_TASKS.denné };
    }
    return parsed;
  });

  const [inspectors, setInspectors] = useState(() => JSON.parse(localStorage.getItem('foxford-inspectors')) || { denné: '', víkendové: '', mesačné: '' });
  const [batchTime, setBatchTime]   = useState(localStorage.getItem('foxford-batch') || null);
  const [newTask, setNewTask]       = useState('');
  const [tempFields, setTempFields] = useState(() => JSON.parse(localStorage.getItem('foxford-temp-fields')) || INIT_TEMP_FIELDS);
  const [temps, setTemps]           = useState(() => {
    const fields = JSON.parse(localStorage.getItem('foxford-temp-fields')) || INIT_TEMP_FIELDS;
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
    const savedData = localStorage.getItem('foxford-inventory-data');
    // Verzia sedí a dáta existujú → použi lokálne (vrátane úprav pobočky)
    if (savedVer === INV_DATA_VERSION && savedData) return JSON.parse(savedData);
    // Nová verzia kódu → štart od INIT_INV, ale zachovaj vlastné pridané položky
    const customItems = JSON.parse(localStorage.getItem('foxford-custom-items')) || [];
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
    const saved = JSON.parse(localStorage.getItem('foxford-inventory')) || {};
    // migrate old string format → new array-of-rows format
    const out = {};
    for (const [key, val] of Object.entries(saved)) {
      out[key] = typeof val === 'string' ? (val ? [{ id: 'r0', label: '', qty: val }] : []) : (Array.isArray(val) ? val : []);
    }
    return out;
  });
  const [invNotes, setInvNotes] = useState(() => JSON.parse(localStorage.getItem('foxford-inventory-notes')) || {});
  const [newCat, setNewCat]     = useState('');
  const [addingTo, setAddingTo] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [notes, setNotes]   = useState(() => JSON.parse(localStorage.getItem('foxford-notes')) || []);
  const [newNote, setNewNote] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const [celebrateHaccp, setCelebrateHaccp] = useState(false);
  const [confirmResetHaccp, setConfirmResetHaccp] = useState(false);
  const [sending, setSending]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [missingWarning, setMissingWarning] = useState([]);
  const [savedAt, setSavedAt] = useState(null);
  const [branch, setBranch] = useState(() => localStorage.getItem('foxford-branch') || null);
  const [showBranchSelect, setShowBranchSelect] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinStep, setPinStep] = useState(false);
  const [shakeName, setShakeName] = useState(false);
  const [shakeInsp, setShakeInsp] = useState(false);
  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');
  const [notifSettings, setNotifSettings] = useState(() => JSON.parse(localStorage.getItem('foxford-notif-settings')) || { enabled: false, time: '09:00' });
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState(() => JSON.parse(localStorage.getItem('foxford-offline-queue')) || []);
  const [offlineFlushed, setOfflineFlushed] = useState(0);
  const [batchElapsedMins, setBatchElapsedMins] = useState(null);

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

  // ── MIDNIGHT AUTO-RESET for denné ──────────────────────────────────────────
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
    const ms = midnight - now;
    const timer = setTimeout(() => {
      setTasks(prev => ({ ...prev, denné: prev.denné.map(t => ({ ...t, done: false, time: null, issue: null })) }));
      setInspectors(prev => ({ ...prev, denné: '' }));
      setBatchTime(null);
      setLastHaccpDate('');
      setTemps(prev => Object.keys(prev).reduce((a, k) => ({ ...a, [k]: '' }), {}));
      localStorage.setItem('foxford-last-reset-date', new Date().toDateString());
      localStorage.setItem('foxford-haccp-date', '');
    }, ms);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    localStorage.setItem('foxford-tasks',           JSON.stringify(tasks));
    localStorage.setItem('foxford-batch',           batchTime || '');
    localStorage.setItem('foxford-last-reset-date', new Date().toDateString());
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
    setSavedAt(new Date().toLocaleTimeString('sk-SK', { hour:'2-digit', minute:'2-digit' }));
  }, [tasks, batchTime, inspectors, tempFields, invData, invQty, invNotes, notes, notifSettings]);

  const scriptUrl = BRANCHES.find(b => b.name === branch)?.url || BRANCHES[0].url;

  const doFetch = (url, type, payload) => {
    fetch(url, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...payload, _token: process.env.REACT_APP_GAS_TOKEN }),
    }).catch(console.error);
  };

  const sendToSheets = (type, payload) => {
    if (!navigator.onLine) {
      // Uložiť do fronty na neskôr (aj s URL pobočky)
      const q = [...offlineQueue, { type, payload, url: scriptUrl, ts: Date.now() }];
      setOfflineQueue(q);
      localStorage.setItem('foxford-offline-queue', JSON.stringify(q));
      return;
    }
    doFetch(scriptUrl, type, payload);
  };

  // Odošli frontu keď príde konektivita
  useEffect(() => {
    if (!online || offlineQueue.length === 0) return;
    offlineQueue.forEach(item => doFetch(item.url, item.type, item.payload));
    const count = offlineQueue.length;
    setOfflineQueue([]);
    localStorage.removeItem('foxford-offline-queue');
    setOfflineFlushed(count);
    setTimeout(() => setOfflineFlushed(0), 4000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  // Batch timer — aktualizácia každú minútu
  useEffect(() => {
    const calc = () => {
      if (!batchTime) { setBatchElapsedMins(null); return; }
      const [hh, mm] = batchTime.split(':').map(Number);
      const now = new Date();
      const batch = new Date(); batch.setHours(hh, mm, 0, 0);
      const diff = Math.floor((now - batch) / 60000);
      setBatchElapsedMins(diff < 0 ? null : diff);
    };
    calc();
    const iv = setInterval(calc, 60000);
    return () => clearInterval(iv);
  }, [batchTime]);

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  const showNotification = (title, body) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    navigator.serviceWorker?.ready.then(reg => {
      reg.showNotification(title, {
        body,
        icon: `${process.env.PUBLIC_URL}/foxford-logo.png.png`,
        badge: `${process.env.PUBLIC_URL}/foxford-logo.png.png`,
        vibrate: [100, 50, 100],
        tag: 'foxford-reminder',
        renotify: true,
      });
    }).catch(() => new Notification(title, { body, icon: `${process.env.PUBLIC_URL}/foxford-logo.png.png` }));
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

  // Schedule daily notification
  useEffect(() => {
    if (!notifSettings.enabled || notifPermission !== 'granted') return;
    const [h, m] = notifSettings.time.split(':').map(Number);
    const now = new Date();
    const target = new Date(); target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const ms = target - now;
    const timer = setTimeout(() => {
      const done = tasks.denné.filter(t => t.done || t.issue).length;
      const total = tasks.denné.length;
      if (done < total) showNotification('Foxford ☕', `Nezabudni na denné úlohy! (${done}/${total} hotovo)`);
    }, ms);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifSettings.enabled, notifSettings.time, notifPermission]);

  // On-open check: if past reminder time and tasks not done, nudge
  useEffect(() => {
    if (!notifSettings.enabled || notifPermission !== 'granted') return;
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

  const doShake = (setter, ref) => {
    setter(true);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ref.current?.focus();
    setTimeout(() => setter(false), 500);
  };

  const needName = () => { if (!controllerName.trim()) { doShake(setShakeName, nameRef); return false; } return true; };

  // ── MULTI-QTY HELPERS ────────────────────────────────────────────────────────
  const addQtyRow    = (itemId) => setInvQty(q => ({ ...q, [itemId]: [...(q[itemId]||[]), { id: 'r'+Date.now(), label:'', qty:'' }] }));
  const removeQtyRow = (itemId, rowId) => setInvQty(q => ({ ...q, [itemId]: (q[itemId]||[]).filter(r => r.id !== rowId) }));
  const updateQtyRow = (itemId, rowId, field, val) => setInvQty(q => ({ ...q, [itemId]: (q[itemId]||[]).map(r => r.id === rowId ? { ...r, [field]: val } : r) }));
  const qtyTotal     = (itemId) => (invQty[itemId]||[]).reduce((s, r) => s + (parseFloat(r.qty)||0), 0);
  const needInsp = () => { if (!inspectors[subTab].trim()) { doShake(setShakeInsp, inspRef); return false; } return true; };

  const pct = () => {
    const t = tasks[subTab] || [];
    return t.length === 0 ? 0 : Math.round(t.filter(x => x.done).length / t.length * 100);
  };

  const onTouchStart = (e, id) => { touchX.current = e.targetTouches[0].clientX; setSwipeId(id); };
  const onTouchMove  = (e) => {
    if (touchX.current === null) return;
    const d = touchX.current - e.targetTouches[0].clientX;
    if (Math.abs(d) > 10 && timerRef.current) clearTimeout(timerRef.current);
    if (d > 0) setSwipeOff(d);
  };
  const onTouchEnd = (t) => {
    if (swipeOff > 70) setTasks({ ...tasks, [subTab]: tasks[subTab].filter(x => x.id !== t.id) });
    touchX.current = null; setSwipeOff(0); setSwipeId(null);
  };

  const uncheckedTask = (t) => {
    setTasks({ ...tasks, [subTab]: tasks[subTab].map(x => x.id === t.id ? { ...x, done: false, time: null, issue: null } : x) });
    setConfirmUndo(null);
  };

  // všetky úlohy sú buď splnené alebo majú zaznamenaný problém
  const allResolved = (list) => list.length > 0 && list.every(t => t.done || t.issue);

  const autoSend = (updatedList) => {
    if (subTab === 'denné') return;
    if (!allResolved(updatedList)) return;
    if (!inspectors[subTab].trim()) return;
    sendToSheets('tasks_summary', {
      date: new Date().toLocaleDateString('sk-SK'),
      category: subTab,
      inspector: inspectors[subTab],
      tasks: updatedList.map(t => ({
        text: t.text,
        done: t.done,
        time: t.time || null,
        date: t.date || null,
        issue: t.issue || null,
      })),
    });
  };

  const onTaskClick = (t) => {
    if (longPress.current || swipeOff > 10) { longPress.current = false; return; }
    if (!needInsp()) return;
    if (t.done) { setConfirmUndo(t); return; }
    const now = new Date();
    const time = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' });
    const updated = tasks[subTab].map(x => x.id === t.id ? { ...x, done: true, time, date, issue: null } : x);
    setTasks({ ...tasks, [subTab]: updated });
    autoSend(updated);
    if (allResolved(updated)) setTimeout(() => setCelebrate(true), 300);
  };

  const longStart = (t) => {
    longPress.current = false;
    timerRef.current = setTimeout(() => { if (swipeOff < 10) { longPress.current = true; setQuickTask(t); } }, 600);
  };
  const longEnd = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const reportIssue = (reason, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!needInsp()) { setQuickTask(null); return; }
    const updated = tasks[subTab].map(x => x.id === quickTask.id ? { ...x, done: false, time: null, issue: reason } : x);
    setTasks({ ...tasks, [subTab]: updated });
    autoSend(updated);
    if (allResolved(updated)) setTimeout(() => setCelebrate(true), 300);
    setQuickTask(null);
  };

  const resetList = () => setConfirmReset(true);

  const doReset = () => {
    if (!inspectors[subTab].trim()) { doShake(setShakeInsp, inspRef); setConfirmReset(false); return; }
    const taskList = tasks[subTab] || [];
    if (taskList.length > 0) {
      sendToSheets('tasks_summary', {
        date: new Date().toLocaleDateString('sk-SK'),
        category: subTab,
        inspector: inspectors[subTab],
        tasks: taskList.map(t => ({ text: t.text, done: t.done, time: t.time || null, date: t.date || null, issue: t.issue || null })),
      });
    }
    setTasks({ ...tasks, [subTab]: tasks[subTab].map(t => ({ ...t, done: false, time: null, issue: null })) });
    setInspectors(prev => ({ ...prev, [subTab]: '' }));
    if (subTab === 'denné') setBatchTime(null);
    setConfirmReset(false);
  };

  const tempColor = (field, val) => {
    const n = parseFloat((val || '').replace(',', '.'));
    if (isNaN(n) || val === '') return null;
    const maxNum = parseFloat((field.max || '').replace(/[^\d.]/g, ''));
    if (isNaN(maxNum)) return 'ok';
    return n > maxNum ? 'err' : 'ok';
  };

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
    <div style={{ maxWidth:500, margin:'0 auto', minHeight:'100vh', fontFamily:'-apple-system,sans-serif', color:C.text, paddingBottom:110, overflowX:'hidden', background:`radial-gradient(ellipse at 15% 0%, rgba(224,160,58,.08) 0%, transparent 55%), radial-gradient(ellipse at 85% 90%, rgba(184,112,32,.06) 0%, transparent 55%), ${C.bg}` }}>
      <style>{`.shake{animation:shake .4s ease-in-out;border-color:${C.err}!important;} @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}`}</style>

      {/* HEADER */}
      <header style={{
        padding:'18px 20px 14px', display:'flex', alignItems:'center',
        position:'sticky', top:0, zIndex:50,
        background:'rgba(242,237,228,0.93)',
        backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
        boxShadow:'0 1px 0 rgba(150,120,80,0.13)',
      }}>
        <div style={{ flex:1, display:'flex', justifyContent:'flex-start' }}>
          {!online && (
            <div style={{ fontSize:9, fontWeight:800, color:C.err, border:`1px solid ${C.err}`, padding:'3px 9px', borderRadius:20, letterSpacing:.5 }}>
              OFFLINE{offlineQueue.length > 0 ? ` (${offlineQueue.length})` : ''}
            </div>
          )}
          {online && offlineFlushed > 0 && (
            <div style={{ fontSize:9, fontWeight:800, color:C.ok, border:`1px solid ${C.ok}`, padding:'3px 9px', borderRadius:20, letterSpacing:.5 }}>
              ✓ {offlineFlushed} odoslaných
            </div>
          )}
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
      <div style={{ height:1, background:`linear-gradient(to right, transparent, ${C.goldLine}, transparent)`, margin:'0 20px 12px' }} />

      {/* ── GLOBAL BATCH BANNER ─────────────────────────────────────────────── */}
      {(() => {
        const elColor = batchElapsedMins === null ? C.muted
          : batchElapsedMins < 120 ? C.ok
          : batchElapsedMins < 240 ? '#d07010'
          : C.err;
        const elStr = batchElapsedMins === null ? null
          : batchElapsedMins < 60 ? `${batchElapsedMins} min`
          : `${Math.floor(batchElapsedMins/60)}h ${batchElapsedMins%60}m`;
        return (
          <div style={{ margin:'0 14px 14px', padding:'11px 16px', borderRadius:16, background:C.panel, border:`1px solid ${batchElapsedMins >= 240 ? C.err+'55' : C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>☕</span>
              <div>
                <div style={{ fontSize:9, fontWeight:800, letterSpacing:1.2, color:C.muted, textTransform:'uppercase' }}>Aktuálny batch</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:1 }}>
                  <span style={{ fontSize:16, fontWeight:800, color: batchTime ? C.gold : C.muted, letterSpacing:.5 }}>{batchTime || '—'}</span>
                  {elStr && <span style={{ fontSize:11, fontWeight:700, color:elColor }}>pred {elStr}</span>}
                </div>
              </div>
            </div>
            <button onClick={() => setBatchTime(new Date().toLocaleTimeString('sk-SK',{hour:'2-digit',minute:'2-digit'}))}
              style={{ background:C.goldDim, border:`1px solid ${C.goldLine}`, color:C.gold, padding:'7px 14px', borderRadius:10, fontWeight:800, fontSize:10, letterSpacing:.8, cursor:'pointer', fontFamily:'inherit' }}>
              NOVÝ
            </button>
          </div>
        );
      })()}

      <div style={{ padding:'0 14px' }}>

        {/* ── TASKS ────────────────────────────────────────────────────────── */}
        {tab === 'tasks' && (
          <>
            {/* Inspector */}
            <Glass accent style={{ padding:'14px 16px' }}>
              <Tag text={`Kontroluje — ${subTab}`} />
              <Inp ref={inspRef} type="text" placeholder="Tvoje meno…"
                value={inspectors[subTab]}
                onChange={e => { const v = e.target.value; setInspectors(prev => ({ ...prev, [subTab]: v })); }}
                shake={shakeInsp}
                style={{ marginTop:7, borderColor: inspectors[subTab] ? C.ok : C.err + '88' }} />
            </Glass>

            {/* Sub-tab switcher */}
            <div style={{ display:'flex', gap:6, marginBottom:10 }}>
              {['denné','víkendové','mesačné'].map(id => (
                <button key={id} onClick={() => setSubTab(id)} style={{
                  flex:1, padding:'9px 4px', borderRadius:12, border:`1px solid ${subTab===id ? C.goldLine : C.border}`,
                  background: subTab===id ? C.goldDim : 'transparent',
                  color: subTab===id ? C.gold : C.sub,
                  fontWeight:700, fontSize:9, letterSpacing:.8, textTransform:'uppercase',
                  cursor:'pointer', fontFamily:'inherit',
                }}>{id}</button>
              ))}
            </div>

            {/* Progress */}
            <Glass style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <Tag text="Postup" />
                <span style={{ fontSize:13, fontWeight:800, color: pct()===100 ? C.ok : C.gold }}>
                  {(tasks[subTab]||[]).filter(t=>t.done).length} / {(tasks[subTab]||[]).length}
                </span>
              </div>
              <div style={{ height:4, background:C.muted, borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct()}%`, background: pct()===100 ? C.ok : C.gold, borderRadius:4, transition:'width .35s ease', boxShadow: pct()>0 ? `0 0 8px ${pct()===100 ? C.ok : C.gold}` : 'none' }} />
              </div>
            </Glass>


            {/* Task list */}
            <Glass style={{ padding:'10px 10px' }}>
              {/* Add */}
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <Inp value={newTask} onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter'&&newTask.trim()){setTasks({...tasks,[subTab]:[...(tasks[subTab]||[]),{id:Date.now(),text:newTask,done:false,time:null,issue:null}]});setNewTask('');} }}
                  placeholder="Pridať úlohu…"
                  style={{ flex:1, fontSize:14, padding:'10px 12px' }} />
                <button onClick={() => { if(newTask.trim()){setTasks({...tasks,[subTab]:[...(tasks[subTab]||[]),{id:Date.now(),text:newTask,done:false,time:null,issue:null}]});setNewTask('');} }}
                  style={{ width:42, borderRadius:12, border:`1px solid ${C.border}`, background:C.panelHov, color:C.gold, fontSize:22, fontWeight:300, cursor:'pointer' }}>+</button>
              </div>

              {/* Tasks — urgent first, then pending, then done */}
              {[...(tasks[subTab]||[])].sort((a,b) => {
                if (a.done !== b.done) return a.done ? 1 : -1;
                if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
                return 0;
              }).map(t => (
                <div key={t.id} style={{ position:'relative', overflow:'hidden', borderRadius:12, marginBottom:5, background: swipeId===t.id ? C.err+'33' : 'transparent' }}>
                  {swipeId===t.id && <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:14, color:C.err, fontWeight:800, fontSize:11 }}>ZMAZAŤ ✕</div>}
                  <div
                    onMouseDown={() => longStart(t)} onMouseUp={longEnd}
                    onTouchStart={e => { longStart(t); onTouchStart(e,t.id); }}
                    onTouchMove={onTouchMove}
                    onTouchEnd={() => { longEnd(); onTouchEnd(t); }}
                    onClick={() => onTaskClick(t)}
                    style={{
                      position:'relative', zIndex:2,
                      transform: swipeId===t.id ? `translateX(-${swipeOff}px)` : 'none',
                      display:'flex', alignItems:'center', gap:12, padding:'13px 12px',
                      background: t.done ? C.okDim : t.issue ? C.errDim : t.urgent ? 'rgba(232,114,114,0.07)' : C.panelHov,
                      borderRadius:12,
                      border:`1px solid ${t.done ? C.ok+'44' : t.issue ? C.err+'44' : t.urgent ? C.err+'55' : C.border}`,
                      cursor:'pointer', userSelect:'none',
                    }}>
                    {/* Circle checkbox */}
                    <div style={{
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
                        <div style={{ fontSize:14, fontWeight:500, color: t.done ? C.sub : C.text, textDecoration: t.done ? 'line-through' : 'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.text}</div>
                      </div>
                      {t.issue && <div style={{ fontSize:11, color:C.err, fontWeight:600 }}>⚠ {t.issue}</div>}
                    </div>
                    {t.done && <span style={{ fontSize:11, fontWeight:700, color:C.ok, flexShrink:0, textAlign:'right', lineHeight:1.4 }}>{t.time}<br/><span style={{ fontSize:10, fontWeight:600, color:C.ok+'99' }}>{t.date}</span></span>}
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
          </>
        )}

        {/* ── TEMPS ────────────────────────────────────────────────────────── */}
        {tab === 'temps' && (
          <>
            <Glass accent style={{ padding:'14px 16px' }}>
              <Tag text="Tvoje meno" />
              <Inp ref={nameRef} type="text" placeholder="Zadaj meno…" value={controllerName}
                onChange={e => setControllerName(e.target.value)} shake={shakeName}
                style={{ marginTop:7, borderColor: controllerName ? C.ok : C.border }} />
            </Glass>

            <Glass style={{ padding:'14px 16px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <span style={{ fontSize:12, fontWeight:700, letterSpacing:1, color:C.sub, textTransform:'uppercase' }}>HACCP — Teplotná kontrola</span>
                <div onClick={() => { if (showAddTemp) { setShowAddTemp(false); setNewTempLabel(''); setNewTempMax(''); } else { setConfirmAddTemp(true); } }}
                  style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                  {showAddTemp && <span style={{ fontSize:11, fontWeight:600, color:C.muted }}>Zrušiť</span>}
                  <span style={{ width:22, height:22, borderRadius:6, border:`1px solid ${showAddTemp ? C.goldLine : C.border}`, background: showAddTemp ? C.goldDim : 'transparent', color: showAddTemp ? C.gold : C.muted, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:300, lineHeight:1 }}>
                    {showAddTemp ? '✕' : '+'}
                  </span>
                </div>
              </div>

              {/* Pridať zariadenie */}
              {showAddTemp && <div style={{ display:'flex', gap:8, marginBottom:14 }}>
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
                  setNewTempLabel(''); setNewTempMax(''); setShowAddTemp(false);
                }} style={{ padding:'9px 16px', borderRadius:12, border:`1px solid ${C.goldLine}`, background:C.goldDim, color:C.gold, fontWeight:700, fontSize:13, cursor:'pointer', flexShrink:0, letterSpacing:.5 }}>Pridať</button>
              </div>}

              {tempFields.map((field) => {
                const val = temps[field.key] || '';
                const status = tempColor(field, val);
                const accentColor = status === 'ok' ? C.ok : status === 'err' ? C.err : C.border;
                return (
                  <div key={field.key} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                        <span style={{ fontSize:11, fontWeight:700, letterSpacing:.5, color: status ? accentColor : C.sub, textTransform:'uppercase' }}>{field.label}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          {field.max && <span style={{ fontSize:10, color:C.muted }}>{field.max}</span>}
                          <span onClick={() => setConfirmRemoveTemp(field)} style={{ color:C.muted, fontSize:12, cursor:'pointer', lineHeight:1 }}>✕</span>
                        </div>
                      </div>
                      <div style={{ position:'relative' }}>
                        <input type="text" inputMode="decimal" placeholder="0.0" value={val}
                          onChange={e => { if (lastHaccpDate === new Date().toDateString()) return; setTemps(prev => ({ ...prev, [field.key]: e.target.value })); }}
                          readOnly={lastHaccpDate === new Date().toDateString()}
                          style={{
                            width:'100%', padding:'10px 14px', borderRadius:12,
                            border:`1.5px solid ${accentColor}`,
                            background: status === 'ok' ? C.okDim : status === 'err' ? C.errDim : C.panel,
                            color: status ? accentColor : C.text,
                            fontSize:18, fontWeight:800, textAlign:'center', letterSpacing:1,
                            outline:'none', boxSizing:'border-box', fontFamily:'inherit',
                            boxShadow: status ? `0 0 10px ${accentColor}22` : 'none',
                            cursor: lastHaccpDate === new Date().toDateString() ? 'default' : 'text',
                          }} />
                        {status && (
                          <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:14 }}>
                            {status === 'ok' ? '✓' : '⚠'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {lastHaccpDate === new Date().toDateString() ? (
                <div style={{ textAlign:'center', padding:'12px 0 4px', color:C.ok, fontSize:13, fontWeight:600 }}>
                  ✓ Na dnes je všetko zaznamenané
                  <div style={{ fontSize:11, color:C.muted, marginTop:4, fontWeight:400 }}>🌙 Polia sa odomknú automaticky o polnoci</div>
                  <button onClick={() => setConfirmResetHaccp(true)} style={{ marginTop:12, background:'none', border:'none', color:C.muted, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textDecoration:'underline' }}>
                    Resetovať teraz
                  </button>
                </div>
              ) : (
                <button disabled={sending} onClick={() => {
                  if (!needName()) return;
                  setSending(true);
                  sendToSheets('haccp', {
                    date: new Date().toLocaleDateString('sk-SK'),
                    podpis: controllerName || 'Anonym',
                    readings: tempFields.map(f => ({ label: f.label, value: temps[f.key] || '', max: f.max })),
                  });
                  setTimeout(() => {
                    setSending(false);
                    const today = new Date().toDateString();
                    setLastHaccpDate(today);
                    localStorage.setItem('foxford-haccp-date', today);
                    setCelebrateHaccp(true);
                  }, 900);
                }} style={{
                  width:'100%', padding:'13px', marginTop:2,
                  background: C.gold, border:'none',
                  color:'#fff', borderRadius:14, fontWeight:800, fontSize:14,
                  letterSpacing:.8, cursor:'pointer', fontFamily:'inherit',
                  opacity: sending ? .7 : 1,
                  boxShadow:`0 4px 18px rgba(184,112,32,0.35)`,
                }}>
                  {sending ? 'Odosielam…' : 'Odoslať kontrolu'}
                </button>
              )}
            </Glass>
          </>
        )}

        {/* ── INVENTORY ────────────────────────────────────────────────────── */}
        {tab === 'inventory' && (
          <>
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
            <Glass style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ color:C.muted, fontSize:14 }}>⌕</span>
              <Inp placeholder="Hľadať položku…" value={invSearch} onChange={e => setInvSearch(e.target.value)}
                style={{ border:'none', padding:'4px 0', background:'transparent', fontSize:14 }} />
              {invSearch && <span onClick={() => setInvSearch('')} style={{ color:C.muted, fontSize:14, cursor:'pointer' }}>✕</span>}
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
            {invData.map(group => {
              const s = strip(invSearch);
              const catMatch = strip(group.category).includes(s);
              const items = s ? (catMatch ? group.items : group.items.filter(i => strip(i.name).includes(s))) : group.items;
              if (s && !catMatch && items.length === 0) return null;
              const open = expCat === group.category || !!invSearch;
              return (
                <Glass key={group.category} style={{ overflow:'hidden', marginBottom:8 }}>
                  <div onClick={() => setExpCat(open && !invSearch ? null : group.category)}
                    style={{ padding:'13px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', borderBottom: open ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:3, height:16, borderRadius:2, background:C.gold }} />
                      <span style={{ fontWeight:700, fontSize:13, color:C.text, letterSpacing:.3 }}>{group.category}</span>
                      <span style={{ fontSize:10, color:C.muted }}>({group.items.length})</span>
                    </div>
                    <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                      <span onClick={e => { e.stopPropagation(); setAddingTo(group.category); }} style={{ color:C.gold, fontSize:20, lineHeight:1, fontWeight:300 }}>+</span>
                      <span onClick={e => { e.stopPropagation(); if(window.confirm(`Zmazať "${group.category}"?`)) setInvData(invData.filter(g=>g.category!==group.category)); }}
                        style={{ color:C.muted, fontSize:12, cursor:'pointer' }}>✕</span>
                      <span style={{ color:C.muted, fontSize:10 }}>{open ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {open && (
                    <div style={{ padding:'10px 12px' }}>
                      {items.map((item, idx) => (
                        <div key={item.id} style={{ paddingBottom:10, marginBottom:10, borderBottom: idx<items.length-1 ? `1px solid ${C.border}` : 'none' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                            <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{item.name}</span>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontSize:10, color:C.gold, fontWeight:700, padding:'2px 7px', border:`1px solid ${C.goldLine}`, borderRadius:8 }}>{item.unit}</span>
                              <span onClick={() => { if(window.confirm(`Zmazať "${item.name}"?`)) setInvData(invData.map(g => g.category===group.category ? {...g, items: g.items.filter(i=>i.id!==item.id)} : g)); }}
                                style={{ color:C.muted, fontSize:12, cursor:'pointer', lineHeight:1 }}>✕</span>
                            </div>
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
                                <div key={row.id} style={{ display:'flex', gap:5, alignItems:'center' }}>
                                  <Inp type="number" placeholder="0" value={row.qty}
                                    onChange={e => updateQtyRow(item.id, row.id, 'qty', e.target.value)}
                                    style={{ width:70, padding:'8px 8px', textAlign:'center', fontWeight:800, fontSize:14 }} />
                                  <span style={{ fontSize:11, color:C.muted, flexShrink:0 }}>{item.unit}</span>
                                  <Inp placeholder="Miesto (napr. Bar)" value={row.label}
                                    onChange={e => updateQtyRow(item.id, row.id, 'label', e.target.value)}
                                    style={{ flex:1, padding:'8px 10px', fontSize:12 }} />
                                  <span onClick={() => removeQtyRow(item.id, row.id)}
                                    style={{ color:C.muted, fontSize:14, cursor:'pointer', lineHeight:1, padding:'0 2px', flexShrink:0 }}>✕</span>
                                </div>
                              ))}
                              <button onClick={() => addQtyRow(item.id)} style={{
                                alignSelf:'flex-start', background:'none',
                                border:`1px dashed ${C.goldLine}`, color:C.gold,
                                fontSize:11, fontWeight:600, padding:'5px 10px',
                                borderRadius:8, cursor:'pointer', fontFamily:'inherit',
                              }}>+ Pridať množstvo</button>
                              {(invQty[item.id]||[]).length > 1 && (
                                <div style={{ fontSize:11, fontWeight:700, color:C.gold, paddingLeft:2 }}>
                                  Spolu: {qtyTotal(item.id)} {item.unit}
                                </div>
                              )}
                              <Inp type="text" placeholder="Poznámka…" value={invNotes[item.id]||''}
                                onChange={e => setInvNotes({...invNotes,[item.id]:e.target.value})}
                                style={{ width:'100%', padding:'8px 10px', fontSize:12, borderStyle:'dashed' }} />
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

            <button onClick={() => {
              if (!needName()) return;
              const missing = invData.flatMap(g => g.items).filter(item => !(invQty[item.id]||[]).some(r => r.qty));
              if (missing.length > 0) { setMissingWarning(missing); return; }
              const allItems = invData.flatMap(g => g.items).filter(item => (invQty[item.id]||[]).some(r => r.qty));
              sendToSheets('inventory', {
                date: new Date().toLocaleDateString('sk-SK'),
                month: `${selectedMonth} ${new Date().getFullYear()}`,
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

            {/* Add category */}
            <Glass style={{ padding:'14px 16px', border:`1px dashed ${C.goldLine}` }}>
              <Inp placeholder="Nová kategória…" value={newCat} onChange={e => setNewCat(e.target.value)} style={{ marginBottom:9 }} />
              <button onClick={() => { if(newCat.trim()){setInvData([...invData,{category:newCat,items:[]}]);setNewCat('');} }}
                style={{ width:'100%', padding:'11px', background:C.panel, border:`1px solid ${C.border}`, color:C.text, borderRadius:12, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                + Pridať kategóriu
              </button>
            </Glass>
          </>
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

            {notes.map(n => (
              <Glass key={n.id} style={{ padding:'14px 16px', borderLeft:`2px solid ${C.goldLine}`, marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <div style={{ fontSize:14, color:C.text, lineHeight:1.6, flex:1 }}>{n.text}</div>
                  <button onClick={() => setNotes(notes.filter(x => x.id !== n.id))}
                    style={{ background:'none', border:'none', color:C.muted, fontSize:16, cursor:'pointer', padding:'0 2px', lineHeight:1, flexShrink:0 }}>×</button>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:C.gold, opacity:.8 }}>{n.author || 'Anonym'}</span>
                  <span style={{ fontSize:10, color:C.muted }}>{n.time}</span>
                </div>
              </Glass>
            ))}
          </>
        )}
      </div>

      {/* ── FLOATING NAV ──────────────────────────────────────────────────────── */}
      <nav style={{
        position:'fixed', bottom:18, left:'50%', transform:'translateX(-50%)',
        width:'88%', maxWidth:390,
        background:'rgba(255,255,255,0.92)',
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        border:`1px solid ${C.border}`,
        borderRadius:50, height:62,
        display:'flex', alignItems:'center',
        boxShadow:'0 8px 32px rgba(0,0,0,.10), 0 0 0 1px rgba(150,120,80,.12)',
        zIndex:100,
      }}>
        {[
          { id:'tasks',     emoji:'✅',  label:'Úlohy' },
          { id:'temps',     emoji:'🌡️',  label:'Teploty' },
          { id:'inventory', emoji:'📦',  label:'Sklad' },
          { id:'notes',     emoji:'💬',  label:'Správy' },
        ].map(({ id, emoji, label }) => {
          const hasAlert = id === 'temps' && lastHaccpDate !== new Date().toDateString();
          const active = tab === id;
          return (
            <div key={id} onClick={() => setTab(id)} style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              cursor:'pointer', gap:3, position:'relative', padding:'6px 4px',
            }}>
              {active && (
                <div style={{ position:'absolute', inset:'4px 6px', background:C.goldDim, borderRadius:12 }} />
              )}
              <div style={{ position:'relative', fontSize:20, zIndex:1, transition:'transform .15s', transform: active ? 'scale(1.12)' : 'scale(1)' }}>
                {emoji}
                {hasAlert && <div style={{ position:'absolute', top:-2, right:-4, width:7, height:7, borderRadius:'50%', background:C.err, boxShadow:`0 0 6px ${C.err}` }} />}
              </div>
              <div style={{ fontSize:9, fontWeight: active ? 700 : 500, letterSpacing:.3, color: active ? C.gold : C.muted, transition:'color .15s', zIndex:1 }}>{label}</div>
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
                setLastHaccpDate('');
                setTemps(tempFields.reduce((a, f) => ({ ...a, [f.key]: '' }), {}));
                localStorage.setItem('foxford-haccp-date', '');
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

      {/* ── ISSUE SHEET ───────────────────────────────────────────────────────── */}
      {quickTask && (
        <div onMouseDown={() => setQuickTask(null)} style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'flex-end', zIndex:2000 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', borderTopLeftRadius:28, borderTopRightRadius:28, padding:'22px 18px 38px', boxShadow:'0 -8px 40px rgba(0,0,0,.10)' }}>
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

            {/* Delete */}
            <button onMouseDown={e => {
              e.stopPropagation();
              setTasks({...tasks, [subTab]: tasks[subTab].filter(x => x.id !== quickTask.id)});
              setQuickTask(null);
            }} style={{ display:'block', width:'100%', padding:'13px 16px', marginBottom:6, borderRadius:14, border:`1px solid ${C.err}33`, background:C.errDim, textAlign:'left', fontSize:14, fontWeight:700, color:C.err, cursor:'pointer', fontFamily:'inherit' }}>
              🗑 Zmazať úlohu
            </button>

            <button onMouseDown={() => setQuickTask(null)} style={{ display:'block', width:'100%', padding:'12px', marginTop:2, background:'none', border:'none', color:C.muted, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Zrušiť</button>
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
                setMissingWarning([]);
                const allItems = invData.flatMap(g => g.items).filter(item => invQty[item.id]);
                sendToSheets('inventory', {
                  date: new Date().toLocaleDateString('sk-SK'),
                  month: `${selectedMonth} ${new Date().getFullYear()}`,
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
            <div style={{ fontSize:22, fontWeight:900, color:C.text, letterSpacing:3 }}>INVENTÚRA ODOSLANÁ!</div>
            <div style={{ marginTop:12, color:C.sub, fontSize:13, textAlign:'center', maxWidth:260, lineHeight:1.6 }}>
              Údaje zostávajú zapísané až do začatia novej inventúry.
            </div>
            <div style={{ marginTop:24, color:C.muted, fontSize:11 }}>klikni kdekoľvek pre zatvorenie</div>
          </div>
        </div>
      )}
    </div>
  );
}
