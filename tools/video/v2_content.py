# PanelGuard student guide v2.0 - every screen's text, in order.
# Part 1 words come from the lab itself (site/js/steps.js, step3.js ... step8.js, viz*.js).
# RULE: no screen states the answer to a gap, a prediction or a final-test question.
# A shot screen: img (file in p1/ or frames/), crop, id, name, do, learn, watch (optional), marks [(x, y, n)], boxes [(x0, y0, x1, y1)]
# (marks and boxes are in the pixels of the source image).

LAB = 'https://ai-bitmonky.github.io/panelguard-defect-inspection-lab/'
REPO = 'github.com/ai-bitmonky/panelguard-defect-inspection-lab'
ELPV = 'elpv-dataset/src/elpv_dataset/data'

S = []
def card(title, lines, sub=None, part=None, say=None, kind='card', prog=None):
    S.append(dict(kind=kind, title=title, lines=lines, sub=sub, part=part, say=say, prog=prog))
def shot(img, id_, name, do, learn=None, watch=None, marks=(), boxes=(), crop='main', prog=None, say=None, label=None, heads=None, quote=None, qlabel='ON SCREEN'):
    S.append(dict(kind='shot', img=img, id=id_, name=name, do=do, learn=learn, watch=watch, marks=list(marks), boxes=list(boxes), crop=crop, prog=prog, say=say, label=label, heads=heads, quote=quote, qlabel=qlabel))
TERM = (352, 66, 1440, 590)
TERM2 = (352, 66, 1440, 330)

# ---------------------------------------------------------------- opening
card('PanelGuard', ['A student guide to the Solar Panel Defect Inspection Lab.',
     'Part 1: the lab in your browser, Steps 0 to 8.',
     'Part 2: the same system as a Python project in GitHub Codespaces.',
     'Pause the video at any screen. Every screen says what to do and why.'],
     sub='Student guide · version 2.0', kind='title')

card('What you need', ['A laptop with Chrome. Not a phone: the screens need space.',
     'Internet, for the first visit to the lab.',
     'For Part 2 only: a free GitHub account.',
     'Nothing to install on the laptop.'], sub='Before you start')

card('Part 1 · The lab', ['You build a real solar-cell defect inspector, step by step, inside one web page.',
     'Python and TensorFlow.js run in the browser tab itself.',
     'Steps 0 to 8, 55 small pages. Do them in order.'], sub='Runs in Chrome · nothing to install', kind='chapter', part=1)

# ---------------------------------------------------------------- how the lab works
P = 'Part 1 · Getting started'
shot('p1/boot_loading.jpg', '1', 'Open the lab',
     'Open Chrome and type the address below. A bar at the top shows Python loading into the tab (about 40 MB the first time).',
     'Wait. Do not reload. The next visit is faster.',
     quote=LAB, qlabel='TYPE THIS ADDRESS', crop='full', prog=P, label='STEP',
     marks=[(60, 72, 1)], boxes=[(0, 56, 1366, 88)],
     say='Open Chrome and type the lab address shown on the screen. A bar at the top shows Python loading into the tab, about 40 megabytes the first time. Wait. Do not reload. The next visit is faster.')
shot('p1/boot_ready.jpg', '2', 'Wait for green',
     'Ready when the dot next to Python turns green, top right.',
     'The TensorFlow.js dot is red here only because this recording PC has no graphics chip. The lab still works.',
     crop='full', prog=P, label='STEP', boxes=[(895, 12, 1362, 42)], marks=[(905, 58, 1)])
shot('p1/boot_ready.jpg', '3', 'The parts of every page',
     '1 Course list. 2 Step title and story. 3 Strip of substeps. 4 Task box. 5 Result panel: what to do next, results, checks.',
     'Every page has the same parts.',
     crop='full', prog=P, label='STEP', marks=[(128, 230, 1), (310, 100, 2), (560, 205, 3), (300, 290, 4), (1300, 124, 5)])
shot('p1/1a_a.jpg', '4', 'Steps, substeps and locks',
     'A lock means: finish the one before. A tick means done. Tap a done substep to look back.',
     'Your work saves itself in this browser on this laptop. Come back later and carry on.',
     watch='Same laptop, same Chrome each time. Clearing browsing data deletes your progress.',
     prog=P, label='STEP', boxes=[(285, 228, 860, 282)], marks=[(452, 238, 1)])
shot('p1/1a_a.jpg', '5', 'The task box',
     'Each numbered line is one gap in the code and says what to type there. A hand sign marks a hands-on part.',
     'Read the task box first.',
     prog=P, label='STEP', boxes=[(276, 308, 870, 512)], marks=[(300, 384, 1), (300, 440, 2)])
shot('p1/1a_c.jpg', '6', 'Blanks and RUN',
     'Each gap is a ____ blank, drawn as a yellow box. Type your answer in its place, then press RUN (or Ctrl + Enter).',
     '"Reset this cell" brings the starter code back.',
     watch='Change only the blanks.',
     crop='full', prog=P, label='STEP', marks=[(328, 680, 1)], boxes=[(285, 662, 375, 698)])
shot('p1/how_blank_work.jpg', '7', 'If a blank is still empty',
     'RUN with a blank left in: nothing runs. A red CHECK names the line with the blank.',
     'Fill it and press RUN again.',
     crop='full', prog=P, label='STEP', boxes=[(910, 102, 1352, 164), (275, 360, 750, 382)], marks=[(925, 100, 1), (290, 370, 2)])
shot('p1/how_wrong_top.jpg', '8', 'If an answer is wrong',
     'A wrong answer gives a red CHECK in plain words: what went wrong and where to look.',
     'No limit on tries. Read, fix the gap, RUN again.',
     crop='full', prog=P, label='STEP', boxes=[(910, 102, 1352, 164), (910, 174, 1352, 278)], marks=[(925, 100, 1), (925, 174, 2)])
shot('p1/how_example.jpg', '9', 'Worked example',
     'Stuck? Open "Worked example". Same idea, other case, other numbers.',
     'It never shows your answer.',
     crop='full', prog=P, label='STEP', marks=[(300, 100, 1)])
shot('p1/2c_after.jpg', '10', 'PASS, then the next one opens',
     'A green PASS unlocks the next substep. Some pages then show a TO DO hands-on task: do it to finish.',
     'After a pass, tap "WHY THIS WORKS" for a step-by-step explanation.',
     prog=P, label='STEP', crop=(895, 54, 1366, 560), marks=[(915, 104, 1)])
shot('p1/how_predict.jpg', '11', 'Predict before you run',
     'Some pages ask for a prediction before RUN. ONE try. RUN stays off until you answer.',
     'Then the page shows the answer and why. A wrong guess costs nothing.',
     crop=(255, 54, 1366, 320), prog=P, label='STEP', boxes=[(276, 176, 870, 300), (910, 102, 1352, 146)])
shot('p1/boot_ready.jpg', '12', 'More space on small screens',
     '1 folds the course list. 2 folds the result panel. Tap again to bring them back.',
     '3 Keep "Review mode" OFF. It is for teachers; work there is not saved.',
     crop='full', prog=P, label='STEP', boxes=[(206, 64, 240, 96), (1320, 64, 1354, 96), (748, 12, 886, 42)], marks=[(223, 120, 1), (1337, 120, 2), (817, 64, 3)])

# ---------------------------------------------------------------- step intro cards + substeps
INTRO = {
 0: ('Step 0 · Meet the line', 'No code · about 10 minutes',
     ['Story: you run the last camera station of a solar module line. Someone must say PASS or STOP for every cell.',
      'You will know the station, what defects look like, and which mistake costs more.']),
 1: ('Step 1 · Get the data ready', 'Python with numpy · about 30 minutes',
     ['Story: the factory saved 2,624 real cell photos, each scored by experts.',
      'You will load, count, label, split and scale them. The test tray gets sealed.']),
 2: ('Step 2 · First inspector with scikit-learn', 'Python · about 40 minutes',
     ['Story: try classic machine learning first. Goal: stop at least 95 of every 100 defects.',
      'You will have a first inspector, a cutoff and an honest report card.']),
 3: ('Step 3 · Train a CNN with Keras + TensorFlow', 'JavaScript with TensorFlow.js · about 60 to 90 minutes',
     ['Story: hand-made features missed thin cracks. A network learns its own filters.',
      'You will have a trained network, a blend with Step 2, and two gates. The Python Keras version is shown below each cell, read-only.']),
 4: ('Step 4 · See what the model looks at', 'JavaScript · about 45 minutes',
     ['Story: check that the model stops cells for the right reason, the crack, not the busbars.',
      'You will have heat maps you can trust and a to-do list of its weak spots.']),
 5: ('Step 5 · Wire the flow with LangGraph', 'JavaScript with LangGraph · about 60 minutes',
     ['Story: every cell must be checked, scored, routed and recorded, and unsure cells must wait for a person.',
      'You will have a working flow and one full shift through it.']),
 6: ('Step 6 · Add the CrewAI quality crew', 'JavaScript with MiniCrew · about 60 minutes',
     ['Story: three AI workers write the shift report, and a checker tests every number.',
      'MiniCrew uses CrewAI\'s names in the browser; the Python CrewAI version sits beside each cell.']),
 7: ('Step 7 · Build the operator console', 'JavaScript, HTML, CSS · about 60 to 75 minutes',
     ['Story: the operator has about 2 seconds per cell. Everything goes behind one clear screen.',
      'You will have a console with a lamp, a line, a queue, a board and a report, tested against faults.']),
 8: ('Step 8 · Line trial and go / no-go', 'JavaScript and Python · about 60 minutes',
     ['Story: the sealed test tray opens once, for an honest trial.',
      'You will have a trial result, an interval, a drift alarm, a go / no-go decision and the final test.']),
}
STEP3_EXTRA = ('Step 3 · Quick or Full training', ['In 3e you pick the length above the code: Quick = 10 epochs, Full = 30. One epoch = one pass over the 1,574 training photos.',
     'The first epoch shows the real time and a countdown. Without a graphics chip, one epoch can take several minutes.',
     'Keep the tab open until it ends. Do not reload. The model is saved in the browser.'])

def P1(id_):
    st = int(id_[0])
    return 'Part 1 · Step %d of 8 · %s' % (st, id_)

SUBS = [
 # (id, name, which shot, what you do, what you learn, watch out)
 # ---- Step 0
 ('0a', 'Walk the station', 'a',
  'No code. Tap the 4 glowing numbered rings: camera, power contacts, monitor, sorter. The result panel explains each part.',
  'A current makes each cell glow. Broken parts stay dark in the photo.', None),
 ('0b', 'See real defects', 'a',
  'Look at each of the 6 photo cards. Guess: good or bad? Then tap the card to flip it.',
  'Cracks are thin dark lines; dead areas are dark patches. The straight lines across every cell are busbars: normal.', None),
 ('0c', 'Weigh the two mistakes', 'a',
  'Drag the two orange cards, missed defect and false alarm, onto the cost each one causes. Or tap a card, then a box.',
  'The course target: stop at least 95 of every 100 defects (recall), then count good cells stopped for nothing.', None),
 ('0d', 'Inspect 12 cells', 'a',
  'You are the inspector. For each of 12 real cells tap PASS or STOP. Your score shows at the end.',
  'You feel the job the machine must do, cell after cell.', None),
 # ---- Step 1
 ('1a', 'Load the pack', 'a',
  'Gap 1: the numpy type for one byte, 0 to 255. Gap 2: how many photos the file holds. RUN. Then tap 2 photos on the wall.',
  'dtype says how to read the bytes; shape says how to cut them.',
  'Type numbers without commas.'),
 ('1b', 'Count the cells', 'a',
  'First predict: the accuracy of a lazy model that says OK for every cell. One try. Then fill the cell type and the second "unsure" score. RUN.',
  'Count first: know how rare defects are.',
  'Text in quotes must match exactly, small letters too.'),
 ('1c', 'Make the label', 'a',
  'Type one cut value so 0.67 and 1.0 become defects and 0 and 0.33 stay OK. RUN. Then drag the yellow line to two other places.',
  'The label is a choice. Write the rule down.',
  'A cell exactly AT the cut counts as a defect.'),
 ('1d', 'Split the data', 'a',
  'Train 60%, validation 20%, test 20%. Gap 1: the label array that keeps the defect share equal in each tray. RUN. Then roll the dice 3 times.',
  'Train to learn, validation to choose, test once at the end. The test tray is now sealed.', None),
 ('1e', 'Scale and flatten', 'a',
  'Gap 1: the number that turns the brightest pixel into 1.0. Gap 2: how many numbers one flat photo has. RUN. Then drag the lens onto the darkest pixel.',
  'To a model a photo is one long row of numbers.', None),
 # ---- Step 2
 ('2a', 'Build the features', 'a',
  'Gap 1: PCA may learn from the train tray only: type the train index array. RUN. Then measure at least 3 feature mixes with the chips and tap "Use this mix".',
  'Anything that learns from data learns from train only.', None),
 ('2b', 'Train three inspectors', 'a',
  'First bet: tap the model you think wins. One try. Gap 1: the number of folds in the plan. Gap 2: the train index array. RUN.',
  'Compare models on folds of the train tray.',
  'Features and labels must be the same cells.'),
 ('2c', 'Read scores, not verdicts', 'a',
  'Gap 1: the column number of "chance of defect". RUN. Then drag the gate until 95 of 100 defects are stopped.',
  'A model gives a score. You choose where to stop.', None),
 ('2d', 'Hit the target', 'a',
  'First predict: tap where on the line the answer will be. One try. Gap 1: the 95% target as a fraction. RUN.',
  'Fix the recall you need, then take the highest cutoff that keeps it.', None),
 ('2e', 'Write the report card', 'a',
  'Gap 1: your cutoff variable from 2d. Gap 2: finish "all good cells = fp + ?". RUN. Then sort each missed defect into a reason box.',
  'Report both: what you catch and what it costs.', None),
 # ---- Step 3
 ('3a', 'Shape the photos', 'a',
  'First drag the 4 tiles into the order TensorFlow reads. Gap 1: that shape as a list of 4 numbers. Gap 2: the number that turns 255 into 1.0. RUN.',
  'TensorFlow reads all photos as one 4-number tensor.',
  'From here the code is JavaScript: square brackets, exact names.'),
 ('3b', 'See what a filter sees', 'a',
  'No code. Set the numbers of one 3 × 3 filter by hand until it lights up the crack but not the busbars.',
  'A CNN layer is many such filters. Training finds their numbers.', None),
 ('3c', 'Build the network', 'a',
  'Gaps: channels in a gray photo, the missing number in 16, 32, ?, 128, and the outputs per cell. RUN. Then tap the block with the most weights.',
  'Weights per layer = 3 × 3 × channels in × filters out.', None),
 ('3d', 'Make more photos for free', 'a',
  'First sort the 5 changed photos. Gap 1: the axis to reverse for a left-right flip (the task box lists the axes). RUN.',
  'Only make changes the camera could really produce.', None),
 ('3e', 'Train it', 'c',
  'First predict: draw the validation score from epoch 1 to 30, then Check. Fill the loss name and the defect-count variable. Pick Quick or Full, RUN, and watch the curves.',
  'The app keeps the best epoch on validation.',
  'Keep the tab open until training ends.'),
 ('3f', 'Score it and blend it', 'a',
  'Gap 1: the index for the same cell\'s Step 2 score. Gap 2: the best false-alarm rate so far. RUN. Then drag the gate on the CNN scores to 95%.',
  'Two inspectors make different mistakes; a mix can cancel some.', None),
 ('3g', 'Two gates, not one', 'a',
  'First drag both gates until at most 5% of defects pass. Gaps: two shares as fractions. RUN. Then set gates for a line with one checker.',
  'Two gates make three lanes: pass, a person looks, stop.',
  'A wider middle lane sends more cells to the person.'),
 # ---- Step 4
 ('4a', 'Mark where YOU look', 'a',
  'No code. You are the expert: paint over the defect on each of 3 real cells.',
  'Later you compare your marks with where the network looks.', None),
 ('4b', 'The cover-up test', 'a',
  'First drag the gray patch until the score falls a lot. Gap 1: the step-size name. Gap 2: the score before the cover. RUN.',
  'Hide a part. If the score falls, that part mattered.', None),
 ('4c', 'Ask the network directly', 'a',
  'Gaps: block 3 counted from 0, the weights variable, the function that turns negatives into 0. RUN (about a minute). Then press and hold on each heat map.',
  'Grad-CAM shows which places pushed the score up.', None),
 ('4d', 'Is the heat map honest?', 'a',
  'First predict: put your 10 tokens on hottest or random pixels, then Check. Gaps: 10% as a fraction, and the count K. RUN.',
  'Test a heat map by removing what it calls important.', None),
 ('4e', 'Where does it fail?', 'a',
  'First drag the two useful chips into the table rows. Gaps: the auto-pass lane name and the other cell type, both in quotes. RUN.',
  'An average can hide a weak spot. Split mistakes by group.', None),
 ('4f', 'Turn mistakes into a to-do list', 'a',
  'No code. Put each real mistake into an action box, then tap "Done sorting". No single right answer.',
  'In Step 8 these boxes become your data shopping list.', None),
 # ---- Step 5
 ('5a', 'Draw the flow', 'a',
  'No code. Drag an arrow from each station to the next one a cell visits. All 7 arrows; wrong ones are refused.',
  'Draw the flow before you code it.', None),
 ('5b', 'The traveller card', 'a',
  'First put every field a station needs on the card. Type the two gaps the task box names. RUN.',
  'The card is the state. The log field adds lines; other fields keep the last value.', None),
 ('5c', 'First two stations', 'a',
  'Type the two gaps and RUN: one real cell goes through. Then tap the cell token, station by station, to END.',
  'A station returns only what it changes.', None),
 ('5d', 'The fork', 'a',
  'First predict: drag 4 real cells into the lanes the fork will choose, then Check. Type the two gaps. RUN.',
  'A conditional edge is a function that names the next station.', None),
 ('5e', 'Shoot again, but not forever', 'a',
  'Fill gap 2. Run 1: no cap in gap 1, as the task box says: see the endless loop. Run 2: the real cap.',
  'Every loop needs a counter and a way out.',
  'Run 1 is meant to fail. Read its message.'),
 ('5f', 'Stop and wait for a person', 'a',
  'Type the two gaps. RUN: 5 cells pause. Then decide each paused cell, pass or stop.',
  'A pause needs interrupt, a memory and a thread id per cell.', None),
 ('5g', 'Run a shift', 'a',
  'Type the two gaps for the poly gate. RUN: the whole validation tray goes through. Then tap every defect that passed in the logbook.',
  'The flow guarantees the routing; quality still depends on scores and people.', None),
 # ---- Step 6
 ('6a', 'Who does what', 'a',
  'No code. Drag each tool card and job card onto the right worker. Wrong cards are refused.',
  'Each worker gets only what it needs.', None),
 ('6b', 'Make a tool', 'a',
  'Type the three gaps from the task box. RUN. Then call each of the 4 tools from the call panel.',
  'Numbers come from tools, never from the model.', None),
 ('6c', 'Hire the workers', 'a',
  'Type the three gaps. RUN. Then tap each of the 3 ID badges to read what its model is given.',
  'Role, goal and backstory become the model\'s instructions. The brain here is scripted: no key needed.', None),
 ('6d', 'Give the jobs an order', 'a',
  'First predict: tap each report line, filled or missing. Run 1 is wrong on purpose: writer first. Run 2: the right order and context.',
  'Order is the task list. Context is what a job may read.', None),
 ('6e', 'Kick off', 'a',
  'Type the three gaps. RUN: the crew works. Then tap the glowing worker to step through the trace to the report.',
  'Agent loop: decide, call a tool, read, answer.', None),
 ('6f', 'Never trust, check', 'a',
  'First find the planted wrong numbers and tap "Done". Type the three gaps. RUN: your checker guards the report.',
  'Check every number against the tools.', None),
 ('6g', 'Plug in a real model (optional)', 'a',
  'Optional. Run the crew with a real model using your own API key, or tap "Skip — no key".',
  'The key stays in page memory only.',
  'Real models work only in the downloaded single-file lab.'),
 # ---- Step 7
 ('7a', 'Sketch the screen', 'a',
  'No code. Drag the 7 blocks into the screen frame; the rules check each move. Then view it "from 2 metres".',
  'The operator has about 2 seconds per cell.', None),
 ('7b', 'Show one cell', 'a',
  'Type the two gaps. RUN: one live cell and its lamp. Then try the "No colour" and "From 2 m" switches.',
  'Unknown is never PASS. It is NO VERDICT.', None),
 ('7c', 'Run the line', 'a',
  'Type the gap. RUN. Turn the speed knob, press Start, run 30 real cells.',
  'Every cell counts once, under the lamp shown.', None),
 ('7d', 'The person\'s queue', 'a',
  'Type the two gaps. RUN. Then clear 10 queued cells with the buttons or the keys P and S.',
  'Your speed shows how many checkers the line needs.', None),
 ('7e', 'The shift board', 'a',
  'First predict: match each manager question to the chart that answers it, then Check. Type the two gaps. RUN.',
  'The question picks the chart.', None),
 ('7f', 'One button, one report', 'a',
  'Type the two gaps. RUN. Then press REPORT in the preview, then COPY.',
  'No checked report, no report.', None),
 ('7g', 'Break it before the plant does', 'a',
  'Run the starter code with its 2 planted bugs. Break it with the fault panel. Fix BUG 1 and BUG 2 as the task box says. Run again and fire all 4 faults.',
  'When in doubt, the screen says NO VERDICT.',
  'Change only the two marked lines.'),
 # ---- Step 8
 ('8a', 'Freeze, then break the seal', 'a',
  'No code. Lock all 6 lines of the freeze sheet, lock your guess range, then press and hold the seal until it breaks.',
  'Freeze first, test once.',
  'After the seal, do not re-run earlier tuning cells.'),
 ('8b', 'The line trial', 'a',
  'Type the three gaps from the task box. RUN once: every sealed cell goes through your frozen flow. Compare with your guess.',
  'The test tray gives the honest number. Report it.', None),
 ('8c', 'How sure is that number?', 'a',
  'First pull the lever until 40 redrawn shifts are on the line. Type the three gaps. RUN: a 95% interval.',
  'A small tray gives a wide band. Trust only the top end.', None),
 ('8d', 'Watch for drift', 'a',
  'Type the two gaps. RUN: a drift alarm. Then tick the alarm you expect for each change and tap "Check my matrix".',
  'No labels on the line: watch inputs and scores.', None),
 ('8e', 'Your own factory photos', 'a',
  'A Python cell: fill the train part and the choosing tray. RUN. Then load your own photo or a sample, and turn your Step 4 boxes into a shopping list.',
  'A learning curve tells what more photos are worth.', None),
 ('8f', 'Go or no-go', 'a',
  'No code. Read the acceptance sheet. Pick go, go with conditions or no-go, tick conditions, press STAMP.',
  'The decision must fit the numbers.', None),
 ('8g', 'What you built', 'a',
  'Tap every stage of your line to see what you built and its real number. Then scroll to the final test.',
  'The whole system, with your own numbers.', None),
]

STEP_OF = {}
for t in SUBS: STEP_OF.setdefault(int(t[0][0]), []).append(t)

for st in range(9):
    title, effort, lines = INTRO[st]
    card(title, lines, sub=effort, prog='Part 1 · Step %d of 8' % st, kind='step')
    if st == 3:
        card(STEP3_EXTRA[0], STEP3_EXTRA[1], sub='Read this before 3e', prog='Part 1 · Step 3 of 8', kind='step')
    for (id_, name, view, do, learn, watch) in STEP_OF[st]:
        shot('p1/%s_%s.jpg' % (id_, view), id_, name, do, learn, watch, prog=P1(id_))
    if st == 8:
        PE = 'Part 1 · After Step 8'
        shot('p1/8g_test.jpg', '8g', 'The final test',
             '15 questions across Steps 1 to 8. Each question says exactly what to do: type, tap or choose. Each one has ONE Check: then it shows the correct answer with an explanation (tap to open) and locks.',
             'Questions you have not checked stay open. Answer them in any order.', prog=PE, label='TEST')
        shot('p1/8g_score.jpg', '8g', 'The scorecard',
             'The SCORECARD on the right fills in as you check: your answer, the correct answer and a tick or a cross for every question.',
             'Below it: your predictions from the whole course, the "Take it home" project and the limits of this build.', prog=PE, label='TEST')
        shot('p1/8g_submit.jpg', '8g', 'Submit',
             'At the end press SUBMIT THE TEST. If some questions are still open, the button asks again: "SUBMIT ANYWAY". Open questions then count as not answered.',
             'After Submit the whole test is locked and you see your score.',
             watch='Check every question before you submit. Submit cannot be undone.', prog=PE, label='TEST')
        shot('p1/8g_retake.jpg', '8g', 'Solutions and retake',
             'After Submit, every wrong answer gets a full step-by-step solution on the right. A RETAKE appears for only the questions you missed, with other values.',
             'Read the solution first, then do the retake question.', prog=PE, label='TEST', crop=(255, 54, 893, 768))
        shot('p1/8g_takehome.jpg', '8g', 'Take it home',
             'The "Take it home" card holds your project as real Python files: train, flow, crew and app. Each file can be opened and copied.',
             'You do not need to copy them by hand: Part 2 shows how to run the same files from the course repository in GitHub Codespaces.', prog=PE, label='CARD')

card('Part 1 · Good to know', ['Your progress lives in this browser on this laptop. Use the same one each time.',
     'Keep "Review mode" OFF.',
     'After you break the seal in Step 8, do not change earlier steps.',
     'Stuck: read the CHECK message, open the Worked example, read the task box again.'], sub='Before Part 2', prog='Part 1 · Done')

# ---------------------------------------------------------------- Part 2
card('Part 2 · The Python project', ['The same system as real Python files, run in GitHub Codespaces.',
     'Fork, create a codespace, wait for setup, run five commands.', 'The numbers shown come from one test run. Yours will differ a little.'], sub='GitHub · fork · codespace · terminal', kind='chapter', part=2)
card('Four words first', ['GitHub: a website that keeps code projects (repositories).',
     'Fork: your own copy of a repository.',
     'Codespace: a cloud computer with VS Code, in a Chrome tab.',
     'Terminal: type a command, press Enter, read the answer.'], sub='Part 2 · words', prog='Part 2 · Words')

def P2(n): return 'Part 2 · %s' % n
F = 'frames/gh_%02d.jpg'
shot(F % 23, '1', 'Open the repository',
     'Sign in to GitHub (free account). Open the repository below. Click Fork, top right.',
     'Your codespace will run from your own copy.',
     crop='full', prog=P2('Fork'), label='CLICK', boxes=[(1093, 120, 1205, 148)], marks=[(1150, 175, 1)], quote=REPO, qlabel='THE REPOSITORY',
     say='Sign in to GitHub. A free account is enough. Open the repository shown on the screen, and click Fork, at the top right. Your codespace will run from your own copy.')
shot(F % 0, '2', 'Create the fork',
     'Keep the names as they are. Scroll down and click the green "Create fork".',
     'Your copy opens: it says "forked from ai-bitmonky".',
     crop='full', prog=P2('Fork'), label='CLICK')
shot(F % 1, '3', 'Open the Code menu',
     'On your fork, click the green "Code" button.',
     'You do not need the Local tab.',
     crop='full', prog=P2('Codespace'), label='CLICK', boxes=[(814, 208, 922, 240)], marks=[(868, 180, 1)])
shot(F % 2, '4', 'Create the codespace',
     'Click the "Codespaces" tab, then "Create codespace on main".',
     'A new tab opens: a cloud computer just for you.',
     crop='full', prog=P2('Codespace'), label='CLICK', boxes=[(508, 248, 712, 282), (484, 28, 572, 54)], marks=[(610, 310, 1)])
shot(F % 8, '5', 'Wait while it is built',
     'VS Code (a code editor) opens while the codespace is built. Wait. Do not close the tab.',
     None,
     crop='full', prog=P2('Codespace'), label='WAIT')
shot(F % 9, '6', 'Trust the folder',
     'If asked "Do you trust the authors...?", click "Trust Folder & Continue".',
     'Without it, setup and the terminal do not run.',
     crop='full', prog=P2('Codespace'), label='CLICK', boxes=[(782, 384, 938, 414)], marks=[(860, 446, 1)])
shot(F % 10, '7', 'Setup runs by itself',
     'Setup runs by itself in the terminal at the bottom: it installs the Python packages and downloads the photos.',
     'About 5 to 10 minutes. Wait for a prompt ending in $.',
     watch='If setup fails: click in the terminal, type  sh tools/takehome/setup.sh  and press Enter.',
     crop='full', prog=P2('Setup'), label='WAIT', boxes=[(366, 428, 900, 488)], marks=[(350, 456, 1)],
     say='Setup runs by itself in the terminal at the bottom. It installs the Python packages and downloads the photos. This takes about 5 to 10 minutes. Wait for a prompt that ends with a dollar sign. Watch out: if setup fails, click in the terminal, type: s h, space, tools slash takehome slash setup dot s h, and press Enter.')
shot(F % 11, '8', 'The terminal and your first command',
     'Click in the terminal. Type the first line below, Enter: you are now in the project folder. Then the train command, Enter.',
     'Type it exactly. Every command goes here.',
     quote=['cd tools/takehome', 'python train.py --elpv ' + ELPV], qlabel='TYPE · each line is one command, then press Enter',
     crop='full', prog=P2('Command 1 of 5 · train.py'), label='TYPE', boxes=[(996, 72, 1412, 94)], marks=[(980, 120, 1)],
     say='Click in the terminal. Type: c d, space, tools slash takehome, and press Enter. You are now in the project folder. Then type the train command shown on the screen, and press Enter. Type it exactly. Every command goes here.')
shot(F % 12, '9', 'train.py: the first lines',
     'train.py does Steps 1 to 3: split, scikit-learn model, Keras CNN, blend and gates. First come warnings.',
     'Lines about cuda, GPU, AVX2, absl or memory only say there is no graphics chip. Ignore them.',
     crop=TERM, prog=P2('Command 1 of 5 · train.py'), label='READ', boxes=[(366, 154, 1424, 272)], quote=['... Could not find cuda drivers on your machine, GPU will not be used.'])
shot(F % 14, '10', 'train.py: reading the epochs',
     '"Epoch 23/30" is round 23 of 30. "50/50": all batches done. val_auc is the ranking score on validation: higher is better, 1.0 is perfect.',
     'Watch val_auc: photos the model did not learn from.',
     crop=TERM, prog=P2('Command 1 of 5 · train.py'), label='READ', boxes=[(366, 268, 1010, 300)], quote=['Epoch 23/30', '50/50 - 6s - 111ms/step - auc: 0.8724 - loss: 0.4459 - val_auc: 0.8645 - val_loss: 0.4118'])
shot(F % 14, '11', 'train.py: done',
     'About 4 minutes. The last line: blend weight and gates. Below low: pass. From high: stop. Between: a person.',
     'Writes svc.joblib, cnn.keras, settings.json. Your numbers will differ a little.',
     watch='Quick check first? Add  --epochs 2  to the command.',
     crop=TERM, prog=P2('Command 1 of 5 · train.py'), label='READ', boxes=[(366, 523, 1340, 552)], quote=['blend weight 0.1 · gates low 0.139 (poly 0.108) high 0.786 · saved in .../tools/takehome · 247 s'])
shot(F % 15, '12', 'flow.py: a validation shift',
     'Type the flow command below. It sends every validation cell through the LangGraph flow (Step 5), in under a minute.',
     'Run it as often as you like: it only uses validation.',
     crop=TERM2, prog=P2('Command 2 of 5 · flow.py'), label='TYPE', boxes=[(366, 216, 1300, 244)], quote=['python flow.py --elpv ' + ELPV], qlabel='TYPE',
     say='Type: python flow dot p y, then the same elpv folder as before, and press Enter. It sends every validation cell through the Lang Graph flow from Step 5, in under a minute. Run it as often as you like: it only uses validation.')
shot(F % 15, '13', 'flow.py: what the numbers mean',
     '"7 of 165 defects passed = 4.2 per 100": defects that got out (target: at most 5). The 95% interval shows how sure. Lanes: where 1,000 cells go.',
     '"A little hopeful": the gates were tuned on this tray.',
     crop=TERM2, prog=P2('Command 2 of 5 · flow.py'), label='READ', boxes=[(366, 216, 1300, 244)], quote=['validation (gates tuned here: a little hopeful): 7 of 165 defects passed = 4.2 per 100 · 95% interval 2.1 to 8.5 · target at most 5', 'lanes per 1,000: pass 330 · person 533 · stop 137 · mono 3.7 vs poly 4.8 per 100'])
shot(F % 17, '14', 'flow.py --trial: the sealed test, ONCE',
     'Done tuning? Add --trial. It opens the sealed test tray, like Step 8, and writes trial.json.',
     'It runs ONCE; a second run is refused. Testing again and again would tune on the test tray.',
     crop=TERM2, prog=P2('Command 3 of 5 · flow.py --trial'), label='TYPE', boxes=[(366, 76, 1424, 104)], quote=['python flow.py --elpv ' + ELPV + ' --trial'], qlabel='TYPE · one line, then press Enter',
     say='Done tuning? Add dash dash trial at the end of the flow command. It opens the sealed test tray, like Step 8, and writes trial dot json. It runs only once. A second run is refused, because testing again and again would tune on the test tray.')
shot(F % 17, '15', 'flow.py --trial: drift and the lanes',
     'Here: 5.5 per 100, interval 2.9 to 10.1. Drift PSI compares the photos with validation: above 0.25 means act.',
     'The top end is above 5, so the target is not met for sure. Report what you get.',
     crop=TERM2, prog=P2('Command 3 of 5 · flow.py --trial'), label='READ', boxes=[(366, 216, 1180, 258)], quote=['TEST TRAY (sealed, once): 9 of 164 defects passed = 5.5 per 100 · 95% interval 2.9 to 10.1 · target at most 5', 'lanes per 1,000: pass 310 · person 547 · stop 143', "drift PSI vs validation (act above 0.25 ...): {'bright': 0.025, 'contrast': 0.031, 'sharp': 0.029}"])
shot(F % 16, '16', 'crew.py --dry: the crew\'s tools',
     'Type the crew command below. It runs the crew tools (Step 6) on the trial logbook, with no language model, in seconds.',
     'The tools print the facts; "guardrail ... True / False" shows the number checker.',
     crop=TERM2, prog=P2('Command 4 of 5 · crew.py --dry'), label='TYPE', boxes=[(366, 88, 1424, 188)], quote=['python crew.py --dry'], qlabel='TYPE',
     say='Type: python crew dot p y, dash dash dry, and press Enter. It runs the crew tools from Step 6 on the trial logbook, with no language model, in seconds. The tools print the facts. Guardrail true and false show the number checker at work.')
shot(F % 18, '17', 'app.py: the operator console',
     'Type the app command below. When it prints "Running on local URL ... 7860", click "Open in Browser" (or Ports tab, globe icon next to 7860).',
     'Ctrl + C in the terminal stops the console.',
     crop=TERM2, prog=P2('Command 5 of 5 · app.py'), label='TYPE', boxes=[(366, 216, 790, 244)], quote=['python app.py --elpv ' + ELPV], qlabel='TYPE',
     say='Type: python app dot p y, then the elpv folder, and press Enter. When it prints Running on local URL, port 7860, click Open in Browser, or open the Ports tab and click the globe icon next to 7860. Control C in the terminal stops the console.')
shot(F % 19, '18', 'The console: NO VERDICT',
     'Before any cell, the lamp says NO VERDICT: the safe default.',
     'START / STOP LINE run and halt the line. NEXT CELL sends one. PASS and STOP answer a queued cell.',
     crop='full', prog=P2('The console'), label='LOOK')
shot(F % 21, '19', 'The console: a real cell',
     'Click NEXT CELL or START. A real cell appears with the flow\'s answer: PASS, CHECK or STOP.',
     '"queue: N waiting" = cells waiting for a person.',
     crop='full', prog=P2('The console'), label='CLICK', boxes=[(522, 496, 712, 536)], marks=[(617, 470, 1)])
shot(F % 20, '20', 'The console: STOP and the shift board',
     'A clear defect gets STOP. SHIFT BOARD shows defects passed per 100, mono and poly, and the lanes.',
     None,
     crop='full', prog=P2('The console'), label='CLICK', boxes=[(1138, 496, 1328, 536), (110, 552, 722, 574)], marks=[(1233, 470, 1), (96, 563, 2)], quote=['5 cells · defects passed 0 of 0 = 0 per 100 (target at most 5) · mono 0 · poly 0 · lanes per block of 50: 5/0/0'])
card('When you finish', ['Stop the codespace: github.com/codespaces, then the ··· menu next to it, then "Stop codespace".',
     'Free hours are used only while it runs. Your files stay.',
     'Idle for about 30 minutes, it stops by itself.',
     'Later: open it again from github.com/codespaces.'], sub='Part 2 · save your free hours', prog='Part 2 · Finish')
card('You are done', ['Lab: Steps 0 to 8 in Chrome, the final test and Submit.',
     'Python project: fork, codespace, setup, five commands, the console.',
     'Results differ a little from run to run. Report the numbers you get.'], sub='PanelGuard · student guide v2.0', kind='title')
