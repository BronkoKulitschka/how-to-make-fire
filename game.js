// Spielzustand und Reaktionen der Gegenstände. Die Kamera bleibt am Lagerplatz.
const game = {
  t:0, awake:false, box:false, matches:3, hand:null, lit:0, pocket:false,
  paper:'wind', pinned:false, braced:false, bottle:false, tag:false, done:false,
  visitor:'none', visitAt:18, coughAt:0, still:false, stormUntil:0,
  fallen:0, note:'', noteUntil:0, sound:'', paperDelay:0
};
function thought(text,duration=3){game.note=text;game.noteUntil=game.t+duration}
function weather(){
  if(game.visitor==='alien'||game.t<game.stormUntil)return 'wind';
  const p=game.t%29;
  return p<8?'wind':p<13?'rain':'quiet';
}
function extinguish(){
  if(game.hand==='match'){game.hand=null;game.fallen++}
  game.lit=0;game.still=false;game.sound='out';
}
function advance(dt){
  if(!game.awake)return;
  game.t+=dt;
  if(game.done)return;
  if(game.t>=game.visitAt){
    if(game.visitor==='none'){game.visitor='person';game.visitAt=game.t+6;game.sound='step'}
    else if(game.visitor==='person'){game.visitor='away';game.visitAt=game.t+10}
    else if(game.visitor==='away'){game.visitor='alien';game.visitAt=game.t+16;game.sound='step'}
    else if(game.visitor==='alien'){game.visitor='away';game.visitAt=game.t+14}
    else game.visitAt=Infinity;
  }
  if(game.lit&&game.t>game.lit)extinguish();
  if(game.coughAt&&game.t>game.coughAt){game.sound='cough';game.coughAt=0}
}
function takeMatch(){
  if(!game.box){game.box=true;game.sound='box';return}
  if(game.hand==='match')return;
  if(!game.matches){game.sound='box';thought('Leer. In der Jacke klickt etwas.');return}
  game.hand='match';game.matches--;game.lit=0;game.still=false;game.sound='box';
}
function ignite(){
  if(game.lit)return;
  if(game.hand!=='match'&&game.hand!=='lighter')return;
  game.sound='strike';
  if(game.t>33&&!game.braced&&game.visitor!=='alien'){
    extinguish();thought('Meine Finger zittern.');return;
  }
  const exposed=weather()!=='quiet';
  game.lit=game.t+(exposed?1.6:8);game.still=false;
}
function touch(id){
  if(game.done)return;
  switch(id){
    case 'box': takeMatch();break;
    case 'stripe': if(game.hand==='match')ignite();else takeMatch();break;
    case 'match':takeMatch();break;
    case 'pocket':
      if(!game.pocket){game.pocket=true;game.sound='box';thought('Ein Feuerzeug. Offenbar meins.')}
      game.hand='lighter';game.still=false;game.lit=0;break;
    case 'lighter':game.hand='lighter';ignite();break;
    case 'knee':game.braced=true;game.sound='cloth';break;
    case 'paper':
      if(game.paper==='wind'){game.paper='held';game.sound='cloth'}
      else if(game.paper==='held'){game.paper='placed';game.sound='cloth'}
      else touch('wood');break;
    case 'stone':
      if(game.paper==='placed'){game.pinned=true;game.sound='stone'}break;
    case 'tag':
      if(game.bottle){game.tag=!game.tag;game.sound='metal';thought(game.tag?'„Feuerstelle vorläufig zugelassen. Rückwirkend.“':'„Bitte wenden.“',4)}break;
    case 'cig':
      if(game.visitor!=='alien')break;
      if(game.hand!=='match'){
        if(game.matches)game.matches--;
        game.hand='match'; // Der Besucher reicht bei leerer Schachtel selbst ein Holz.
      }
      game.lit=game.t+5;game.still=true;game.coughAt=game.t+1.1;
      game.visitor='leaving';game.visitAt=Infinity;game.stormUntil=game.t+9;game.sound='strike';break;
    case 'wood':
      if(game.paper==='held'){game.paper='placed';game.sound='cloth';break}
      if(!game.lit)break;
      if(game.still||weather()!=='quiet'){extinguish();break}
      if(game.paper!=='placed'){extinguish();thought('Das Holz ist feucht.');break}
      if(!game.pinned){game.paper='wind';game.paperDelay=game.t+2;extinguish();break}
      if(!game.bottle){game.bottle=true;extinguish();game.sound='metal';break}
      if(!game.tag){extinguish();game.sound='metal';thought('Das Blechschild liegt wieder auf dem Papier.');break}
      game.done=true;game.hand=null;game.lit=0;game.sound='fire';thought('Es brennt.',5);break;
  }
}
