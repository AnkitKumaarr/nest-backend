// Test script to verify the missing week insertion logic
function testWeekInsertion() {
  // Simulate existing weeks: Week 1, Week 2, Week 4, Week 5 (Week 3 is missing)
  const existingWeeks = [
    { weekNumber: 1, label: "Week 1" },
    { weekNumber: 2, label: "Week 2" },
    { weekNumber: 4, label: "Week 4" },
    { weekNumber: 5, label: "Week 5" }
  ];

  // Simulate missing weeks that need to be inserted
  const missingWeeks = [
    { weekNumber: 3, label: "Week 3" }
  ];

  // Apply the new insertion logic
  const updatedWeeks = [...existingWeeks];
  missingWeeks.forEach(missingWeek => {
    const insertIndex = updatedWeeks.findIndex(
      existingWeek => existingWeek.weekNumber > missingWeek.weekNumber
    );
    
    if (insertIndex === -1) {
      updatedWeeks.push(missingWeek);
    } else {
      updatedWeeks.splice(insertIndex, 0, missingWeek);
    }
  });

  console.log("Result:", updatedWeeks.map(w => w.label));
  console.log("Expected: [Week 1, Week 2, Week 3, Week 4, Week 5]");
  console.log("Correct:", JSON.stringify(updatedWeeks.map(w => w.label)) === JSON.stringify(["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"]));
}

testWeekInsertion();
