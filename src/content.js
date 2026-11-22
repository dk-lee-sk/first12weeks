/* First 12 Weeks — learning content.
 * Every medical/health claim must cite a public source in `s`.
 * See CLAUDE.md > Content rules before editing. Keep copy short: it is read on phones. */
(function(){
'use strict';
const CARDS = [
 {id:'feeds', t:'8–12 feeds a day', b:'Newborns usually feed 8–12 times in 24 hours, night included. Feeds spread out over the weeks.', s:'AAP (HealthyChildren.org)'},
 {id:'cues', t:'Crying is a late hunger cue', b:'Early hunger cues: stirring, rooting (head turning, mouth open), hands to mouth, lip smacking. Feeding on early cues is calmer for both of you.', s:'NHS'},
 {id:'safesleep', t:'Safe sleep: back, flat, empty', b:'Always on their back, on a firm flat mattress in their own crib, with nothing else in it. Share your room, not your bed, ideally for the first 6 months.', s:'AAP, NHS'},
 {id:'burp', t:'Burp during and after feeds', b:'Pause to burp mid-feed and after. Hold baby upright and pat or rub gently.', s:'AAP (HealthyChildren.org)'},
 {id:'nappies', t:'Count the wet nappies', b:'From about day 5, expect at least 6 heavy wet nappies a day. Fewer can mean baby isn’t getting enough milk: check with your midwife or doctor.', s:'NHS'},
 {id:'poo', t:'What poo tells you', b:'Dark, sticky meconium first, then mustard-yellow (breastfed) or pale brown (formula). Pale, chalky-white or grey poo needs a call to your doctor.', s:'NHS'},
 {id:'stump', t:'Cord stump care', b:'Keep the stump clean and dry, with sponge baths until it falls off, usually within 1–3 weeks.', s:'AAP (HealthyChildren.org)'},
 {id:'bath', t:'Baths: 2–3 a week is plenty', b:'Water about 37°C; test with your elbow. Never leave baby alone in water, not even for a second.', s:'AAP, NHS'},
 {id:'tired', t:'Tired signs & awake windows', b:'Early tired signs: staring, going quiet, jerky movements, yawning, rubbing eyes. Young babies manage about 45–90 minutes awake.', s:'General guidance — ranges vary'},
 {id:'overtired', t:'Overtired = harder to settle', b:'Miss the tired window and baby gets overtired: more crying, arching, fighting sleep. Catching early signs makes settling easier.', s:'General guidance'},
 {id:'tummy', t:'Tummy time from day one', b:'Short sessions a few times a day, only while baby is awake and watched. It builds neck and shoulder strength.', s:'AAP (HealthyChildren.org)'},
 {id:'cluster', t:'Cluster feeding', b:'Feeds bunched together, often in the evening or during growth spurts, are normal and temporary. You’re not doing it wrong.', s:'NHS'},
 {id:'blues', t:'Baby blues, and when it’s more', b:'Feeling weepy or anxious in the first two weeks is very common. If it lasts longer or feels heavy, talk to your doctor, midwife or health visitor. Partners can be affected too.', s:'NHS'},
 {id:'fever', t:'Fever under 3 months', b:'A temperature of 38°C (100.4°F) or higher in a baby under 3 months needs medical advice straight away.', s:'AAP, NHS'},
 {id:'purple', t:'The crying peak', b:'Crying often rises from about 2 weeks, peaks around 6–8 weeks and eases by 3–5 months. Some crying has no fix. It’s not your fault.', s:'National Center on Shaken Baby Syndrome'},
 {id:'nevershake', t:'If it gets too much', b:'It’s OK to lay baby safely on their back in the crib and step away for a few minutes. Never shake a baby.', s:'NHS, NCSBS'},
 {id:'soothe', t:'Ways to soothe', b:'Holding, rocking, shushing or white noise, and sucking can all help. You can’t spoil a newborn with comfort.', s:'AAP (HealthyChildren.org)'},
 {id:'smile', t:'First social smiles', b:'Around 6–8 weeks many babies start smiling back when you smile and talk.', s:'CDC developmental milestones'},
 {id:'vaccines', t:'Two-month vaccines', b:'In many countries the first routine vaccines are due around 8 weeks. Check your local schedule.', s:'NHS, CDC'},
 {id:'swaddle', t:'When to stop swaddling', b:'Swaddle snug at the chest, loose at the hips. Stop as soon as baby tries to roll, often around 2 months.', s:'AAP (HealthyChildren.org)'},
 {id:'sleephours', t:'How much do newborns sleep?', b:'Roughly 14–17 hours a day, in short stretches across day and night.', s:'National Sleep Foundation'},
 {id:'nights', t:'Night waking is normal', b:'Short stretches and night feeds are normal for months. Some babies sleep longer around 3 months; the normal range is wide.', s:'AAP (HealthyChildren.org)'},
 {id:'talk', t:'Talk, sing, narrate', b:'Talking and singing, even narrating your day, supports language and bonding. Pause and let baby “answer” with coos.', s:'CDC, AAP'},
 {id:'weightloss', t:'Early weight loss is normal', b:'Most babies lose a little weight in the first days and regain it by about 2–3 weeks (sources vary). Your midwife or health visitor will weigh baby. If you’re worried about feeding or weight, contact them.', s:'NHS (nhs.uk, Your baby’s weight and height)'},
 {id:'growth', t:'Growth charts: your baby’s own curve', b:'Percentile charts compare baby with others of the same age. There’s no “best” percentile: healthy babies follow their own line, and the trend matters more than one reading. If you’re worried about growth, talk to your midwife, health visitor or doctor.', s:'WHO Child Growth Standards; NHS; AAP (HealthyChildren.org)'},
 {id:'help', t:'Accepting help is the job', b:'Rest when baby sleeps, share nights, say yes to food or a shift. A rested parent is calmer and safer.', s:'NHS'},
];

const WEEKS = {
 1:{t:'Welcome home', n:['Feeds every 2–3 hours, night too.','Cord stump on: sponge baths only.','Mission: spot hunger cues before crying starts.'], c:['feeds','weightloss','fever']},
 2:{t:'No rhythm yet (that’s normal)', n:['Evening cluster feeding is common.','Weepy or overwhelmed? “Baby blues” often show up now.','Back near birth weight. See the health panel.'], c:['blues','growth']},
 3:{t:'Growth spurt', n:['A growth spurt can make baby hungrier for a few days.','Try short tummy time when baby is calm and alert.','Know the fever rule for under 3 months.'], c:['fever']},
 4:{t:'Awake a little longer', n:['Awake windows stretch a little.','Tired signs get easier to read. Catch them early.'], c:['tired','sleephours']},
 5:{t:'The fussy weeks begin', n:['Crying builds toward a peak around 6–8 weeks.','Some evening crying has no fixable cause.'], c:['nevershake']},
 6:{t:'Watch for a smile', n:['Social smiles often appear around now.','Another growth spurt is common this week.'], c:[]},
 7:{t:'Peak crying, peak tiredness', n:['Often the hardest stretch. Share the nights.','Accepting help is part of the job.'], c:[]},
 8:{t:'Two months', n:['First routine vaccines are usually due around now. Check your local schedule.','Stop swaddling when baby tries to roll.'], c:['vaccines','swaddle']},
 9:{t:'Calmer evenings', n:['Crying often eases after the peak.','You read this baby’s cues better than anyone now.'], c:[]},
 10:{t:'Longer night stretches', n:['Some babies sleep a little longer at night. Night feeds are still normal.'], c:['nights']},
 11:{t:'Getting social', n:['Coos, smiles, tracking your face. Talk, sing, narrate your day.'], c:['talk']},
 12:{t:'Twelve weeks in', n:['The final day. Put it all together.'], c:[]},
};

const CUES = {
 hunger:{name:'Hunger', early:'Stirring, turning head with mouth open.', mid:'Sucking fists, smacking lips, squirming.', late:'Crying hard, red-faced, frantic head movements.'},
 sleep:{name:'Tiredness', early:'Staring into space, going quiet, moving slowly.', mid:'Yawning, rubbing eyes, jerky arm and leg movements.', late:'Crying, arching back, fighting sleep.'},
 diaper:{name:'Nappy', early:'Squirming, a little restless.', mid:'Fussing and wriggling. Is that a smell?', late:'Crying, clearly uncomfortable.'},
 gas:{name:'Wind', early:'Squirming and grunting after the feed.', mid:'Grimacing, knees pulled up, tense tummy.', late:'Crying, knees drawn up, firm tummy.'},
 purple:{name:'Unexplained crying', early:'', mid:'', late:'Inconsolable. Fed, changed, winded; nothing seems wrong.'},
 bath:{name:'Bath', early:'Milk in the neck folds; a little sticky.', mid:'Sticky neck folds, a bit grumpy.', late:'Sticky and grumpy.'},
 bored:{name:'Ready to connect', early:'Quiet and alert: bright eyes, studying your face.', mid:'Alert, kicking, starting to fuss for attention.', late:''},
};
const LESSON = {
 hunger:'The main cue was <b>hunger</b>. Rooting and hands to mouth come first; crying is late.',
 sleep:'The main cue was <b>tiredness</b>: staring, yawning, jerky movements.',
 diaper:'The main cue was the <b>nappy</b>: restless wriggling, plus a smell.',
 gas:'The main cue was <b>wind</b>: grimacing with knees up soon after a feed.',
 purple:'This was <b>unexplained crying</b>. With needs met, hold, rock and shush.',
 bath:'The cue was a <b>bath</b>: sticky neck folds. No rush.',
 bored:'Baby was <b>quiet-alert</b>, the best time for tummy time, faces and talking.',
};
window.F12_CONTENT = {CARDS, WEEKS, CUES, LESSON};
})();
