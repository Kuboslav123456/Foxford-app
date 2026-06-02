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
          time: t.time || null, date: t.date || null, issue: t.issue || null,
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

    // 3) Reset localStorage stavu pre nový deň — zachovať vlastné úlohy, len resetnúť stav
    const baseDenne = (Array.isArray(tasksData.denné) && tasksData.denné.length > 0) ? tasksData.denné : INIT_TASKS.denné;
    const resetTasks = { ...tasksData, denné: baseDenne.map(t => ({ ...t, done: false, time: null, date: null, issue: null })) };
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
  const [tab, setTab]           = useState('tasks');
  const [subTab, setSubTab]     = useState('denné');
  const [expCat, setExpCat]     = useState(null);
  const [quickTask, setQuickTask] = useState(null);
  const [pressingId, setPressingId] = useState(null);
  const [pressPos, setPressPos] = useState({ x: 0, y: 0 });
  const [bouncingCheck, setBouncingCheck] = useState(null);
  const [lockedAlert, setLockedAlert] = useState(null); // { shift }
  const [invNumpad, setInvNumpad]     = useState(null); // { itemId, rowId, value, unit, itemName }
  const [confirmUndo, setConfirmUndo] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
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
  const touchX   = useRef(null);

  const [tasks, setTasks] = useState(() => {
    // Catch-up loop nad nami už zapísal reset do localStorage ak preskočili sa dni,
    // takže tu už len bezpečne načítame uložené úlohy.
    const saved = localStorage.getItem('foxford-tasks');
    if (!saved) return INIT_TASKS;
    try { return JSON.parse(saved); } catch (_) { return INIT_TASKS; }
  });

  const [inspectors, setInspectors] = useState(() => safeParse('foxford-inspectors', { denné: '', víkendové: '', mesačné: '' }));
  const [newTask, setNewTask]       = useState('');
  const [tempFields, setTempFields] = useState(() => safeParse('foxford-temp-fields', INIT_TEMP_FIELDS));
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
  const [missingWarning, setMissingWarning] = useState([]);
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
  const [odpisyAuthor, setOdpisyAuthor] = useState(() => localStorage.getItem('foxford-odpisy-author') || '');

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
        setTasks(prev => ({ ...prev, denné: prev.denné.map(t => ({ ...t, done: false, time: null, issue: null })) }));
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
    // Throttle: aktualizuj "uložené o XX:XX" max raz za 30 sekúnd (znižuje zbytočné re-rendery)
    const nowMs = Date.now();
    if (nowMs - savedAtThrottle.current > 30000) {
      savedAtThrottle.current = nowMs;
      setSavedAt(new Date().toLocaleTimeString('sk-SK', { hour:'2-digit', minute:'2-digit' }));
    }
  }, [tasks, inspectors, tempFields, invData, invQty, invNotes, notes, notifSettings, odpisy, odpisyAuthor]);

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
    if (!navigator.onLine) {
      // Uložiť do fronty na neskôr (aj s URL pobočky)
      const q = [...offlineQueue, { type, payload, url: scriptUrl, ts: Date.now() }];
      setOfflineQueue(q);
      localStorage.setItem('foxford-offline-queue', JSON.stringify(q));
      return;
    }
    doFetch(scriptUrl, type, payload);
  };

  // Odošli frontu keď príde konektivita. Failed položky (network-level) vrátime späť do fronty.
  useEffect(() => {
    if (!online) return;
    const queue = safeParse('foxford-offline-queue', []);
    if (queue.length === 0) return;
    // Hneď vyčisti frontu aby sa nezdvojili odoslanie pri rýchlych online/offline prepnutiach
    setOfflineQueue([]);
    localStorage.removeItem('foxford-offline-queue');

    Promise.allSettled(queue.map(item => {
      const url = item.url;
      if (!url || /^URL_POBOCKA/.test(url) || !/^https?:\/\//.test(url)) {
        return Promise.reject(new Error('invalid URL'));
      }
      return fetch(url, {
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

  // Live hodiny — aktualizácia každú sekundu
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

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

  // Schedule daily notification
  useEffect(() => {
    if (!notifSettings.enabled || notifPermission !== 'granted') return;
    if (!/^\d{1,2}:\d{2}$/.test(notifSettings.time || '')) return;
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
    // Automaticky otvor numpad pre nový riadok
    setInvNumpad({ itemId, rowId: newId, value: '', unit: unit || '', itemName: itemName || '' });
  };
  const removeQtyRow = (itemId, rowId) => setInvQty(q => ({ ...q, [itemId]: (q[itemId]||[]).filter(r => r.id !== rowId) }));
  const updateQtyRow = (itemId, rowId, field, val) => setInvQty(q => ({ ...q, [itemId]: (q[itemId]||[]).map(r => r.id === rowId ? { ...r, [field]: val } : r) }));
  const qtyTotal     = (itemId) => Math.round((invQty[itemId]||[]).reduce((s, r) => s + (parseFloat((r.qty||'').toString().replace(',','.'))||0), 0) * 1000) / 1000;

  // ── NUMPAD HELPERS ───────────────────────────────────────────────────────
  const numpadPress = key => setInvNumpad(prev => {
    if (!prev) return prev;
    let v = prev.value;
    if (key === '⌫') { v = v.slice(0, -1); }
    else if (key === '.') { if (!v.includes('.')) v += v === '' ? '0.' : '.'; }
    else if (v === '0') { v = key; }
    else { if (v.length < 8) v += key; }
    return { ...prev, value: v };
  });
  const numpadConfirm = () => {
    if (!invNumpad) return;
    updateQtyRow(invNumpad.itemId, invNumpad.rowId, 'qty', invNumpad.value);
    setInvNumpad(null);
  };
  const needInsp = () => { if (!inspectors[subTab].trim()) { doShake(setShakeInsp, inspRef); return false; } return true; };

  // ── ODPISY HELPERS ───────────────────────────────────────────────────────
  const ODPISOVY_DOVODY = ['Spotreba', 'Pokazené', 'Rozbité', 'Ochutnávka'];
  const todayKey     = localDayKey(new Date());
  const yesterdayKey = localDayKey(new Date(Date.now() - 86400000));

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
    const t = tasks[subTab] || [];
    return t.length === 0 ? 0 : Math.round(t.filter(x => x.done).length / t.length * 100);
  };

  const onTouchStart = (e, id) => { touchX.current = e.targetTouches[0].clientX; };
  const onTouchMove  = (e) => {
    if (touchX.current === null) return;
    const d = touchX.current - e.targetTouches[0].clientX;
    if (Math.abs(d) > 10 && timerRef.current) { clearTimeout(timerRef.current); setPressingId(null); }
  };
  const onTouchEnd = () => { touchX.current = null; };

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
    if (longPress.current) { longPress.current = false; return; }
    if (!needInsp()) return;
    if (t.done) { setConfirmUndo(t); return; }
    setBouncingCheck(t.id);
    setTimeout(() => setBouncingCheck(null), 500);
    const now = new Date();
    const time = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' });
    const updated = tasks[subTab].map(x => x.id === t.id ? { ...x, done: true, time, date, issue: null } : x);
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
                  {(tasks[subTab]||[]).filter(t=>t.done).length} / {(tasks[subTab]||[]).length}
                </span>
              </div>
              <div style={{ height:7, background:C.muted, borderRadius:4, overflow:'hidden' }}>
                <div className="progress-fill" style={{ height:'100%', width:`${pct()}%`, background: pct()===100 ? C.ok : C.gold, borderRadius:4, boxShadow: pct()>0 ? `0 0 10px ${pct()===100 ? C.ok : C.gold}` : 'none' }} />
              </div>
            </Glass>
            </div>

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
        {tab === 'temps' && (() => {
          const activeTemps    = haccpShift === 'ranné' ? temps    : tempsVecerne;
          const setActiveTemps = haccpShift === 'ranné' ? setTemps : setTempsVecerne;
          const activeDone     = haccpShift === 'ranné' ? lastHaccpDate === new Date().toDateString() : lastHaccpDateVecerne === new Date().toDateString();
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
                  setTempsVecerne(prev => ({ ...prev, [key]: '' }));
                  setNewTempLabel(''); setNewTempMax(''); setShowAddTemp(false);
                }} style={{ padding:'9px 16px', borderRadius:12, border:`1px solid ${C.goldLine}`, background:C.goldDim, color:C.gold, fontWeight:700, fontSize:13, cursor:'pointer', flexShrink:0, letterSpacing:.5 }}>Pridať</button>
              </div>}

              <div style={{ display: isTablet ? 'grid' : 'block', gridTemplateColumns: isDesktop ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10 }}>
              {tempFields.map((field) => {
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
                          <span onClick={() => setConfirmRemoveTemp(field)} style={{ color:C.muted, fontSize:12, cursor:'pointer', lineHeight:1 }}>✕</span>
                        </div>
                      </div>
                      <div style={{ position:'relative' }}>
                        {activeDone ? (
                          /* Uzamknutý stav — namiesto inputu obyčajný div (žiadny scroll/keyboard/focus) */
                          <div role="button" tabIndex={-1}
                            onClick={e => { e.preventDefault(); e.stopPropagation(); setLockedAlert({ shift: haccpShift }); }}
                            onTouchStart={e => { e.preventDefault(); e.stopPropagation(); setLockedAlert({ shift: haccpShift }); }}
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
                          <input type="text" inputMode="decimal" placeholder="0.0" value={val}
                            onChange={e => setActiveTemps(prev => ({ ...prev, [field.key]: e.target.value }))}
                            style={{
                              width:'100%', padding:'10px 14px', borderRadius:12,
                              border:`1.5px solid ${accentColor}`,
                              background: status === 'ok' ? C.okDim : status === 'err' ? C.errDim : C.panel,
                              color: status ? accentColor : C.text,
                              fontSize:18, fontWeight:800, textAlign:'center', letterSpacing:1,
                              outline:'none', boxSizing:'border-box', fontFamily:'inherit',
                              boxShadow: status ? `0 0 10px ${accentColor}22` : 'none',
                              cursor:'text',
                            }} />
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

              {activeDone ? (
                <div style={{ textAlign:'center', padding:'12px 0 4px', color:C.ok, fontSize:13, fontWeight:600 }}>
                  ✓ {haccpShift === 'ranné' ? 'Ranná' : 'Večerná'} kontrola zaznamenaná
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
              )}
            </Glass>
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
                    <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                      {editMode && <span onClick={e => { e.stopPropagation(); setAddingTo(group.category); }} style={{ color:C.gold, fontSize:20, lineHeight:1, fontWeight:300 }}>+</span>}
                      {editMode && <span onClick={e => { e.stopPropagation(); if(window.confirm(`Zmazať "${group.category}"?`)) setInvData(invData.filter(g=>g.category!==group.category)); }}
                        style={{ color:C.err, fontSize:12, cursor:'pointer' }}>✕</span>}
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
                                style={{ color:C.err, fontSize:11, cursor:'pointer', lineHeight:1, flexShrink:0, opacity:.8 }}>✕</span>}
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
                                      onPointerDown={e => { e.preventDefault(); setInvNumpad({ itemId: item.id, rowId: row.id, value: row.qty || '', unit: item.unit, itemName: item.name }); }}
                                      style={{
                                        width:70, padding:'9px 8px', borderRadius:12, boxSizing:'border-box',
                                        border:`1px solid ${row.qty ? C.goldLine : C.border}`,
                                        background: row.qty ? C.goldDim : 'rgba(255,255,255,0.85)',
                                        color: row.qty ? C.gold : C.muted,
                                        fontSize:16, fontWeight:800, textAlign:'center',
                                        cursor:'pointer', userSelect:'none', WebkitUserSelect:'none',
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
                                  <button onMouseDown={e => { e.preventDefault(); setInvNotes({...invNotes,[item.id]:''}); document.activeElement?.blur(); setActiveInvField(null); }}
                                    style={{ flex:1, padding:'6px', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                                    Zrušiť
                                  </button>
                                  <button onMouseDown={e => { e.preventDefault(); document.activeElement?.blur(); setActiveInvField(null); }}
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
            <div onClick={() => setEditMode(v => !v)}
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
                  <span style={{ fontSize:10, color:C.muted }}>{n.time}</span>
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
                      <Inp type="text" inputMode="decimal" placeholder="0"
                        value={entry.qty}
                        onChange={e => updateOdpisQty(todayKey, entry.id, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
                        enterKeyHint="done"
                        style={{ width:70, padding:'8px', textAlign:'center', fontWeight:800, fontSize:14, flexShrink:0 }} />
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
                    <button onClick={exportOdpisyPDF} style={{
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
          { id:'inventory', emoji:'📦',  label:'Sklad' },
          { id:'odpisy',    emoji:'📝',  label:'Odpisy' },
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
        <div onMouseDown={() => setLockedAlert(null)} onTouchStart={() => setLockedAlert(null)}
          style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3500, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}
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
        <div onPointerDown={() => setInvNumpad(null)}
          style={{ position:'fixed', inset:0, background:'rgba(30,22,8,.55)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
                   display:'flex', alignItems:'center', justifyContent:'center', zIndex:3500, padding:24 }}>
          <div onPointerDown={e => e.stopPropagation()} className="sheet-bounce"
            style={{ background:C.modal, border:`1px solid ${C.borderM}`, width:'100%', maxWidth:340,
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

            {/* Confirm + Cancel */}
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button onPointerDown={e => { e.preventDefault(); setInvNumpad(null); }}
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
