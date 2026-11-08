const fresh=()=>({time:0,playing:false,done:false,matches:3,paper:false,pinned:false,lighter:false,cold:false,braced:false,bottle:false,stamp:false,visitor:0,visitAt:0,stormUntil:0,steadyUntil:0,flameUntil:0,strikes:0,note:"",lastAction:0});
let s=fresh();
function weather(){
 if(s.done)return "calm";
 if(s.visitor===2||s.time<s.stormUntil)return "wind";
 const phase=s.time%26;
 return phase<8?"wind":phase<13?"rain":"calm";
}
function say(line){s.note=line;s.lastAction=s.time}
function tick(dt){
 if(!s.playing||s.done)return;
 s.time+=dt;
 if(s.visitor===0 && s.time>=18){s.visitor=1;s.visitAt=s.time;say("Etwas verdunkelt das Holz. Neben dir knirscht Kies.")}
 else if(s.visitor===1&&s.time-s.visitAt>7){s.visitor=3;s.visitAt=s.time;say("Der Schatten ist weg. Der Kies knirscht noch einmal.")}
 else if(s.visitor===3&&s.time-s.visitAt>12){s.visitor=2;s.visitAt=s.time;say("Eine Zigarette ragt ins Bild. Der Schatten hat diesmal mehr Finger.")}
 else if(s.visitor===2&&s.time-s.visitAt>13){s.visitor=3;s.visitAt=s.time;say("Der Schatten zieht weiter. Die Zigarette auch.")}
 if(s.time>=24)s.cold=true;
}
function available(){
 if(!s.playing)return [["start","Platz nehmen"]];
 if(s.done)return [["restart","Noch einmal"]];
 const a=[];
 if(s.visitor===2)a.push(["give","Feuer geben"]);
 if(s.time<s.steadyUntil)a.push(["move","Flamme zum Holz"]);
 if(!s.paper && paperInReach())a.push(["paper","Papier greifen"]);
 if(s.paper&&!s.pinned)a.push(["pin","Stein aufs Papier"]);
 if(s.time>=s.steadyUntil&&s.time>=s.flameUntil){if(s.matches)a.push(["match","Streichholz anreißen"]);
 if(s.lighter)a.push(["light","Feuerzeug zünden"]);}
 if(s.cold&&!s.braced)a.push(["brace","Hände abstützen"]);
 if(!s.lighter)a.push(["pocket","Jacke abtasten"]);
 if(s.bottle&&!s.stamp)a.push(["sign","Schild umdrehen"]);
 return a;
}
function paperInReach(){return s.time%10>3&&s.time%10<8}
function ignite(kind){
 s.strikes++;
 if(kind==="match")s.matches--;
 if(s.cold&&!s.braced){
  say(kind==="match"?"Die Finger zittern. Das Holz fällt zwischen die Scheite.":"Dein Daumen rutscht ab. Die Finger zittern.");return;
 }
 s.flameUntil=s.time+.85;
 if(weather()==="wind"){say("Ein kurzes Fssst. Ein Blatt streift deine Hand.");return}
 if(weather()==="rain"){say("Ein einzelner Tropfen trifft die Flamme.");return}
 if(!s.paper){say("Eine schwarze Kerbe im Holz. Ein Fetzen Papier treibt vorbei.");return}
 if(!s.pinned){say("Das Papier hebt an einer Ecke ab. Neben dem Holz liegt ein flacher Stein.");return}
 if(!s.bottle){s.bottle=true;say("Ein metallisches Klonk. Auf deinem Stein steht eine Flasche mit einem Blechschild.");return}
 if(!s.stamp){say("Das Blechschild kippt über den Zunder. Auf der Rückseite steht etwas.");return}
 s.done=true;say("Es brennt. Ein Windstoß. Es brennt immer noch.");
}
function act(id){
 if(!available().some(([key])=>key===id))return;
 switch(id){
 case "start":s.playing=true;say("Drei Hölzer. Die Blätter bewegen sich.");break;
 case "restart":s=fresh();break;
 case "paper":s.paper=true;say("Trocken. Beim Bücken klickt etwas in deiner Jacke.");break;
 case "pin":s.pinned=true;say("Der Stein hält das Papier am Holz.");break;
 case "brace":s.braced=true;say("Du stützt die Hand auf deinem Knie ab.");break;
 case "pocket":s.lighter=true;say("Ein Feuerzeug. Offenbar deins.");break;
 case "give":{
  const borrowed=s.matches===0;
  if(!borrowed)s.matches--;
  s.visitor=4;s.steadyUntil=s.time+5;s.stormUntil=s.time+8;
  say(borrowed?"Der Gast reicht dir ein Streichholz. Die Zigarette glüht.":"Die Zigarette glüht. Von weit oben kommt ein leises Husten.");break;}
 case "move":s.steadyUntil=s.time;s.flameUntil=0;say("Auf halbem Weg erlischt das Streichholz.");break;
 case "sign":s.stamp=true;say("„Feuerstelle vorläufig zugelassen. Rückwirkend.“ Das Schild bleibt jetzt auf der anderen Seite hängen.");break;
 case "match":case "light":ignite(id);break;
 }
}
