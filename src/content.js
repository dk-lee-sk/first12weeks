/* First 12 Weeks — learning content.
 * Every medical/health claim must cite a public source in `s`.
 * See CLAUDE.md > Content rules before editing. */
(function(){
'use strict';
const CARDS = [
 {id:'feeds', t:'8–12 feeds a day', b:'Newborns usually feed 8–12 times in 24 hours — roughly every 2–3 hours, night included. Feeds spread out a little over the weeks.', s:'AAP (HealthyChildren.org)'},
 {id:'cues', t:'Crying is a late hunger cue', b:'Early hunger cues: stirring, rooting (turning the head with mouth open), hands to mouth, lip smacking. Feeding on early cues is calmer for both of you.', s:'NHS'},
 {id:'safesleep', t:'Safe sleep: back, flat, empty', b:'Always on their back, on a firm flat mattress in their own crib, with nothing else in it — no pillows, bumpers, toys or loose blankets. Share your room (not your bed), ideally for the first 6 months.', s:'AAP, NHS'},
 {id:'burp', t:'Burp during and after feeds', b:'Pause to burp mid-feed and after. Hold baby upright on your shoulder or sitting supported on your lap, and pat or rub gently.', s:'AAP (HealthyChildren.org)'},
 {id:'nappies', t:'Count the wet nappies', b:'From about day 5, expect at least 6 heavy wet nappies every 24 hours. Fewer can be a sign baby isn’t getting enough milk — check with your midwife or doctor.', s:'NHS'},
 {id:'poo', t:'What poo tells you', b:'Dark, sticky meconium in the first days, then mustard-yellow (breastfed) or pale brown (formula). Pale, chalky-white or grey poo needs a call to your doctor.', s:'NHS'},
 {id:'stump', t:'Cord stump care', b:'Keep the stump clean and dry, and stick to sponge baths until it falls off — usually within 1–3 weeks.', s:'AAP (HealthyChildren.org)'},
 {id:'bath', t:'Baths: 2–3 a week is plenty', b:'Daily baths aren’t needed. Aim for water around 37°C, test it with your elbow, and never leave baby alone in water — not even for a second.', s:'AAP, NHS'},
 {id:'tired', t:'Tired signs & awake windows', b:'Early tired signs: staring, going quiet, jerky movements, yawning, rubbing eyes. Young babies can often only manage about 45–90 minutes awake before needing sleep again.', s:'General guidance — ranges vary'},
 {id:'overtired', t:'Overtired = harder to settle', b:'Miss the tired window and babies can get overtired: more crying, arching, fighting sleep. Catching early tired signs makes settling easier.', s:'General guidance'},
 {id:'tummy', t:'Tummy time from day one', b:'Short sessions a few times a day, only while baby is awake and you’re watching. It builds neck and shoulder strength.', s:'AAP (HealthyChildren.org)'},
 {id:'cluster', t:'Cluster feeding', b:'Feeds bunched close together, often in the evening or during growth spurts. It’s normal and temporary — not a sign you’re doing it wrong.', s:'NHS'},
 {id:'blues', t:'Baby blues — and when it’s more', b:'Feeling weepy, anxious or low in the first two weeks after birth is very common. If it lasts longer than two weeks or feels heavy, talk to your doctor, midwife or health visitor. Partners can be affected too.', s:'NHS'},
 {id:'fever', t:'Fever under 3 months', b:'A temperature of 38°C (100.4°F) or higher in a baby under 3 months needs medical advice straight away.', s:'AAP, NHS'},
 {id:'purple', t:'The crying peak', b:'Crying often increases from about 2 weeks, peaks around 6–8 weeks, and eases by 3–5 months. Some crying has no fixable cause. It’s not your fault.', s:'National Center on Shaken Baby Syndrome'},
 {id:'nevershake', t:'If it gets too much', b:'It’s OK to put baby down safely on their back in the crib and step away for a few minutes to calm yourself. Never shake a baby.', s:'NHS, NCSBS'},
 {id:'soothe', t:'Ways to soothe', b:'Holding close, gentle rocking, shushing or white noise, and letting baby suck can all help. You can’t spoil a newborn with comfort.', s:'AAP (HealthyChildren.org)'},
 {id:'smile', t:'First social smiles', b:'Around 6–8 weeks many babies start smiling back when you smile and talk to them.', s:'CDC developmental milestones'},
 {id:'vaccines', t:'Two-month vaccines', b:'In many countries the first routine vaccinations are due around 8 weeks / 2 months. Check your local schedule.', s:'NHS, CDC'},
 {id:'swaddle', t:'When to stop swaddling', b:'Swaddle snugly at the chest but loose at the hips, and stop as soon as baby shows signs of trying to roll — often around 2 months.', s:'AAP (HealthyChildren.org)'},
 {id:'sleephours', t:'How much do newborns sleep?', b:'Roughly 14–17 hours in 24 hours, in short stretches spread across day and night.', s:'National Sleep Foundation'},
 {id:'nights', t:'Night waking is normal', b:'Short stretches and night feeds are normal for months. Some babies sleep longer stretches by around 3 months — the range of normal is wide.', s:'AAP (HealthyChildren.org)'},
 {id:'talk', t:'Talk, sing, narrate', b:'Talking and singing to your baby — even narrating your day — supports early language and bonding. Pause and let them “answer” with coos.', s:'CDC, AAP'},
 {id:'help', t:'Accepting help is the job', b:'Rest when baby sleeps, split night duties, and say yes to offers of food or a shift. A rested parent is a calmer, safer parent.', s:'NHS'},
];

const WEEKS = {
 1:{t:'Welcome home', n:['Feeds come every 2–3 hours, day and night.','The cord stump is still on — sponge baths only.','Your mission: spot hunger cues before the crying starts.'], c:['feeds']},
 2:{t:'No rhythm yet (that’s normal)', n:['Evening cluster feeding is common.','Weepy or overwhelmed? The “baby blues” often show up around now.'], c:['blues']},
 3:{t:'Growth spurt', n:['A growth spurt can make baby hungrier for a few days.','Try short tummy time when baby is calm and alert.','Know this one by heart: fever rules under 3 months.'], c:['fever']},
 4:{t:'Awake a little longer', n:['Awake windows stretch a bit; baby notices more.','Tired signs get easier to read — catch them early.'], c:['tired','sleephours']},
 5:{t:'The fussy weeks begin', n:['Crying tends to build toward a peak around 6–8 weeks.','Some evening crying has no cause you can fix.'], c:['nevershake']},
 6:{t:'Watch for a smile', n:['Social smiles often appear around now — tummy time and face time are good moments.','Another growth spurt is common this week.'], c:[]},
 7:{t:'Peak crying, peak tiredness', n:['Often the hardest stretch. Share the nights.','Accepting help is part of the job.'], c:[]},
 8:{t:'Two months', n:['First routine vaccinations are usually due around now — check your local schedule.','Stop swaddling as soon as baby shows signs of trying to roll.'], c:['vaccines','swaddle']},
 9:{t:'Calmer evenings', n:['Crying often starts easing after the peak.','You read this baby’s cues better than anyone now.'], c:[]},
 10:{t:'Longer night stretches', n:['Some babies sleep a little longer at night. Night feeds are still normal.'], c:['nights']},
 11:{t:'Getting social', n:['Coos, smiles and tracking your face. Talk, sing, narrate your day.'], c:['talk']},
 12:{t:'Twelve weeks in', n:['The final day. Put everything you’ve learned together.'], c:[]},
};

const CUES = {
 hunger:{name:'Hunger', early:'Stirring, turning head side to side with mouth open.', mid:'Sucking on fists, smacking lips, squirming.', late:'Crying hard, red-faced, frantic head movements.'},
 sleep:{name:'Tiredness', early:'Staring into space, going quiet, slower movements.', mid:'Yawning, rubbing eyes, jerky arm and leg movements.', late:'Crying, arching back, fighting sleep.'},
 diaper:{name:'Nappy', early:'Squirming, a little restless.', mid:'Fussing and wriggling — and is that a smell?', late:'Crying, clearly uncomfortable down below.'},
 gas:{name:'Wind', early:'Squirming and grunting after the feed.', mid:'Grimacing, knees pulled up, tense tummy.', late:'Crying with knees drawn up and a firm tummy.'},
 purple:{name:'Unexplained crying', early:'', mid:'', late:'Inconsolable crying. Fed, changed, winded — nothing seems wrong.'},
 bath:{name:'Bath', early:'Milk residue in the neck folds; a little sticky.', mid:'Sticky neck folds and a bit grumpy about it.', late:'Sticky and grumpy.'},
 bored:{name:'Ready to connect', early:'Quiet and alert: bright eyes, studying your face.', mid:'Alert, kicking, starting to fuss for attention.', late:''},
};
const LESSON = {
 hunger:'The main cue was <b>hunger</b> — rooting and hands to mouth come first; crying is a late sign.',
 sleep:'The main cue was <b>tiredness</b> — staring, yawning and jerky movements mean “put me down”.',
 diaper:'The main cue was the <b>nappy</b> — restless wriggling, plus a smell.',
 gas:'The main cue was <b>wind</b> — grimacing with knees up shortly after a feed.',
 purple:'This was <b>unexplained crying</b>. With needs met, holding, rocking and shushing is the right response.',
 bath:'The cue was a <b>bath</b> — sticky neck folds. No rush, though.',
 bored:'Baby was in the <b>quiet-alert</b> state — the best moment for tummy time, faces and talking.',
};
window.F12_CONTENT = {CARDS, WEEKS, CUES, LESSON};
})();
