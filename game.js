// Zeiten in Spielsekunden. Das vorbereitete Holz ist trocken und liegt locker.
const matchLifetime=8;
const heatToIgnite=1.7;
const game={
  awake:false, box:false, matches:3, held:false, remaining:0, spent:0,
  heat:0, stage:'cold', stageTime:0, sound:'', note:''
};
function openOrTake(){
  if(game.stage!=='cold')return;
  if(!game.box){game.box=true;game.sound='box';return}
  if(game.held)return;
  if(game.matches===0){game.note='Die Schachtel ist leer.';return}
  game.matches--;
  game.held=true;
  game.sound='box';
}
function strikeMatch(){
  if(!game.held||game.remaining>0||game.stage!=='cold')return;
  game.remaining=matchLifetime;
  game.sound='strike';
}
function advance(dt,flameAtShavings){
  if(!game.awake)return;
  const burningFor=Math.min(game.remaining,dt);
  if(game.stage==='cold'){
    if(flameAtShavings&&burningFor>0)game.heat+=burningFor;
    else game.heat=Math.max(0,game.heat-dt*1.6);
    if(game.heat>=heatToIgnite){game.heat=heatToIgnite;game.stage='shavings';game.stageTime=0}
  }else{
    game.stageTime+=dt;
    if(game.stage==='shavings'&&game.stageTime>=3){game.stage='twigs';game.stageTime=0}
    if(game.stage==='twigs'&&game.stageTime>=6){game.stage='logs';game.stageTime=0;game.note='Es brennt.'}
  }
  if(burningFor>0){
    game.remaining=Math.max(0,game.remaining-dt);
    if(game.remaining===0){game.held=false;game.spent++;game.sound='out'}
  }
}
