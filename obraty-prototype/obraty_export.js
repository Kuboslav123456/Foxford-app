/* Obraty → Excel (verná kópia so živými vzorcami).
   Spoločná logika pre prehliadač (appka) aj Node (test). Mapovanie a tokeny
   sú identické s overeným Python generátorom. */
(function (root) {
  'use strict';

  var MES = ['Január','Február','Marec','Apríl','Máj','Jún','Júl','August','September','Október','November','December'];
  var DNI = ['pondelok','utorok','streda','štvrtok','piatok','sobota','nedeľa']; // Po..Ne (getUTCDay: Ne=0)

  var KKp = {
    POS1:{odvod:'D',obrat:'F',zaokr:'G',karta:'I',darcek:'J',dpPouk:'M',dpMartinus:'N',dpEticket:'O'},
    POS2:{odvod:'P',obrat:'R',zaokr:'S',karta:'U',darcek:'V',dpPouk:'Y',dpMartinus:'Z',dpEticket:'AA'},
    POS3:{odvod:'AC',obrat:'AE',zaokr:'AF',karta:'AH',darcek:'AI',dpPouk:'AK',dpMartinus:'AL',dpEticket:'AM'},
    POS4:{odvod:'AO',obrat:'AQ',zaokr:'AR',karta:'AT',darcek:'AU',dpPouk:'AW',dpMartinus:'AX',dpEticket:'AY'},
    POS5:{odvod:'BA',obrat:'BC',zaokr:'BD',karta:'BF',darcek:'BG',dpPouk:'BI',dpMartinus:'BJ',dpEticket:'BK'}
  };
  var KK_NAKUP = {POS3:'AB'};
  var OOp = {
    RP1:{odvod:'C',obrat:'E',zaokr:'F',karta:'H',darcek:'I',dpPouk:'K',dpMartinus:'L',dpEticket:'M',odvodOO:'O',uhrHot:'P',uhrZaokr:'Q',uhrKarta:'R',darcek2:'S',dpPouk2:'U',dpMartinus2:'V',dpEticket2:'W'},
    RP2:{odvod:'AB',obrat:'AD',zaokr:'AE',karta:'AG',darcek:'AH',dpPouk:'AJ',dpMartinus:'AK',dpEticket:'AL',odvodOO:'AN',uhrHot:'AO',uhrZaokr:'AP',uhrKarta:'AQ',darcek2:'AR',dpPouk2:'AT',dpMartinus2:'AU',dpEticket2:'AV'},
    RP3:{odvod:'BA',obrat:'BC',zaokr:'BD',karta:'BF',darcek:'BG',dpPouk:'BI',dpMartinus:'BJ',dpEticket:'BK',odvodOO:'BM',uhrHot:'BN',uhrZaokr:'BO',uhrKarta:'BP',darcek2:'BQ',dpPouk2:'BS',dpMartinus2:'BT',dpEticket2:'BU'}
  };
  var FXp = {vkladBanka:'C',odvod:'D',nakupy:'E',prevodMalaKasa:'F',obrat:'H',zaokr:'I',karta:'K',upKarta:'L',qerko:'N',tringelty:'O',gastro:'P',vklad:'Q'};

  function n(v){ var x=parseFloat(v); return isFinite(x)?x:0; }
  function isNum(v){ return v!==undefined && v!==null && v!=='' && isFinite(parseFloat(v)); }
  function pad2(x){ return (x<10?'0':'')+x; }
  function addMonths(ym,k){ var p=ym.split('-'),y=+p[0],m=+p[1]-1+k; var d=new Date(Date.UTC(y,m,1)); return d.getUTCFullYear()+'-'+pad2(d.getUTCMonth()+1); }
  function daysInMonth(ym){ var p=ym.split('-'); return new Date(Date.UTC(+p[0], +p[1], 0)).getUTCDate(); }
  function monthTok(ym){ var p=ym.split('-'); return MES[+p[1]-1]+'_'+p[0]; }
  function serial(y,m,d){ return Math.round((Date.UTC(y,m-1,d)-Date.UTC(1899,11,30))/86400000); }

  function clone(ws){ return JSON.parse(JSON.stringify(ws)); }
  function setNum(ws,addr,val){ ws[addr]={t:'n',v:val}; }
  function setStr(ws,addr,val){ ws[addr]={t:'s',v:String(val)}; }
  function setFormula(ws,addr,f){ ws[addr]={t:'n',f:f}; }
  function setDate(ws,addr,y,m,d){ ws[addr]={t:'n',v:serial(y,m,d),z:'d.m.yyyy'}; }

  // doplní tokeny vo všetkých vzorcoch hárka
  function replaceTokens(ws, Mtok, days, prevTok){
    Object.keys(ws).forEach(function(addr){
      if(addr[0]==='!') return;
      var c=ws[addr];
      if(c && typeof c.f==='string' && c.f.indexOf('@')>=0){
        var f=c.f.replace(/@M@/g,Mtok).replace(/@D@/g,String(days));
        if(prevTok) f=f.replace(/@P@/g,prevTok);
        c.f=f;
      }
    });
  }

  function monthsWithData(S){
    var set={};
    function add(k){ var ym=k.slice(k.lastIndexOf('|')+1).slice(0,7); if(/^\d{4}-\d{2}$/.test(ym)) set[ym]=1; }
    Object.keys(S.entries||{}).forEach(function(k){ var d=k.split('|')[2]; if(d) set[d.slice(0,7)]=1; });
    Object.keys(S.days||{}).forEach(function(k){ var d=k.split('|')[1]; if(d) set[d.slice(0,7)]=1; });
    Object.keys(S.blocky||{}).forEach(function(k){ set[k.split('|')[1]]=1; });
    Object.keys(S.monthMeta||{}).forEach(function(k){ set[k.split('|')[1]]=1; });
    return Object.keys(set).sort();
  }

  // hlavná funkcia — vráti workbook (SheetJS) so všetkými mesiacmi
  function buildObratyWorkbook(XLSX, tplB64, S, monthsArg){
    var tpl = XLSX.read(tplB64, {type:'base64', cellFormula:true, cellStyles:false});
    var months = (monthsArg && monthsArg.length) ? monthsArg.slice().sort() : monthsWithData(S);
    if(!months.length) throw new Error('Žiadne dáta na export.');
    var monthsSet={}; months.forEach(function(m){ monthsSet[m]=1; });
    var op=(S.settings&&S.settings.openingDrawer)||{}, oc=(S.settings&&S.settings.openingCash)||{};
    var out = XLSX.utils.book_new();

    months.forEach(function(ym){
      var y=+ym.split('-')[0], m=+ym.split('-')[1];
      var Mtok=monthTok(ym), days=daysInMonth(ym);
      var prevYm=addMonths(ym,-1), chain=!!monthsSet[prevYm];
      var prevTok=chain?monthTok(prevYm):null;

      ['KK','OO','FXF'].forEach(function(base){
        var ws=clone(tpl.Sheets[base+'_@M@']);
        replaceTokens(ws, Mtok, days, prevTok);
        var name=base+'_'+Mtok;

        // prvý/nereťazený mesiac → prenosy ako počiatočné čísla
        if(!chain){
          if(base==='KK'){
            setNum(ws,'E3',n(op['KK|POS1'])); setNum(ws,'Q3',n(op['KK|POS2'])); setNum(ws,'AD3',n(op['KK|POS3']));
            setNum(ws,'AP3',n(op['KK|POS4'])); setNum(ws,'BB3',n(op['KK|POS5'])); setNum(ws,'BO3',0); setNum(ws,'E36',n(oc.KK));
          } else if(base==='OO'){
            setNum(ws,'D3',n(op['OO|RP1|A3'])+n(op['OO|RP1|OO'])); setNum(ws,'Z3',n(op['OO|RP1|A3'])); setNum(ws,'AA3',n(op['OO|RP1|OO']));
            setNum(ws,'AC3',n(op['OO|RP2|A3'])+n(op['OO|RP2|OO'])); setNum(ws,'AY3',n(op['OO|RP2|A3'])); setNum(ws,'AZ3',n(op['OO|RP2|OO']));
            setNum(ws,'BB3',n(op['OO|RP3|A3'])+n(op['OO|RP3|OO'])); setNum(ws,'BX3',n(op['OO|RP3|A3'])); setNum(ws,'BY3',n(op['OO|RP3|OO']));
            setNum(ws,'CA3',0); setNum(ws,'E38',n(oc.OO));
          } else {
            setNum(ws,'C3',0); setNum(ws,'G3',n(op['FXF|FX15'])); setNum(ws,'E36',n(oc.FXF));
            setFormula(ws,'C37', n(op['FXF|MALAKASA'])+'+F2-K53');
          }
        }

        // dátumy + dni
        for(var d=1; d<=days; d++){
          var r=3+d, dt=new Date(Date.UTC(y,m-1,d));
          setDate(ws,'A'+r,y,m,d);
          setStr(ws,'B'+r, DNI[(dt.getUTCDay()+6)%7]);
        }

        // bločky daného mesiaca
        var kkblk=(S.blocky||{})['KK|'+ym]||[];
        var fxblk=(S.blocky||{})['FXF|'+ym]||[];
        function nakupDay(blk,dstr){ var s=0; blk.forEach(function(b){ if(b.datum===dstr) s+=n(b.suma); }); return s; }

        // zápisy pokladní
        Object.keys(S.entries||{}).forEach(function(key){
          var p=key.split('|'), u=p[0], reg=p[1], d2=p[2];
          if(d2.slice(0,7)!==ym) return;
          var r=3+parseInt(d2.slice(8,10),10), e=S.entries[key];
          if(base==='KK' && u==='KK' && KKp[reg]){
            var map=KKp[reg];
            Object.keys(map).forEach(function(f){ if(isNum(e[f])) setNum(ws,map[f]+r,n(e[f])); });
            if(KK_NAKUP[reg]){ var v=nakupDay(kkblk,d2); if(v) setNum(ws,KK_NAKUP[reg]+r,Math.round(v*100)/100); }
          } else if(base==='OO' && u==='OO' && OOp[reg]){
            var mo=OOp[reg];
            Object.keys(mo).forEach(function(f){ if(isNum(e[f])) setNum(ws,mo[f]+r,n(e[f])); });
          } else if(base==='FXF' && u==='FXF'){
            Object.keys(FXp).forEach(function(f){ if(isNum(e[f])) setNum(ws,FXp[f]+r,n(e[f])); });
            if(e.popis) setStr(ws,'R'+r,e.popis);
          }
        });

        // denné polia
        Object.keys(S.days||{}).forEach(function(key){
          var p=key.split('|'), u=p[0], d2=p[1];
          if(d2.slice(0,7)!==ym) return;
          var r=3+parseInt(d2.slice(8,10),10), dd=S.days[key];
          if(base==='KK' && u==='KK'){
            if(isNum(dd.prevodOffice)) setNum(ws,'BM'+r,n(dd.prevodOffice));
            if(isNum(dd.vkladBanka)) setNum(ws,'BO'+r,n(dd.vkladBanka));
          } else if(base==='OO' && u==='OO'){
            if(isNum(dd.vkladBankaOO)) setNum(ws,'CA'+r,n(dd.vkladBankaOO));
          }
        });

        // bločky tabuľka
        if(base==='KK'){
          kkblk.slice(0,15).forEach(function(b,i){ var r=38+i;
            if(b.datum){ var q=b.datum.split('-'); setDate(ws,'I'+r,+q[0],+q[1],+q[2]); }
            if(isNum(b.suma)) setNum(ws,'J'+r,n(b.suma)); if(b.ucel) setStr(ws,'K'+r,b.ucel); });
          var mk=(S.monthMeta||{})['KK|'+ym]||{};
          setNum(ws,'C37',n(mk.rozmienanie)); setNum(ws,'C38',n(mk.neodvedene));
        }
        if(base==='OO'){
          var mo2=(S.monthMeta||{})['OO|'+ym]||{};
          setNum(ws,'C38',n(mo2.rozmienanie)); setNum(ws,'C40',n(mo2.neodvedene));
        }
        if(base==='FXF'){
          fxblk.slice(0,15).forEach(function(b,i){ var r=38+i;
            if(b.datum){ var q=b.datum.split('-'); setDate(ws,'J'+r,+q[0],+q[1],+q[2]); }
            if(isNum(b.suma)) setNum(ws,'K'+r,n(b.suma)); if(b.ucel) setStr(ws,'L'+r,b.ucel); });
        }

        XLSX.utils.book_append_sheet(out, ws, name);
      });
    });
    return out;
  }

  root.buildObratyWorkbook = buildObratyWorkbook;
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildObratyWorkbook: buildObratyWorkbook };
})(typeof window !== 'undefined' ? window : globalThis);
