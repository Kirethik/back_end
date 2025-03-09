const mongoose = require('mongoose');

const userClusterSchema = new mongoose.Schema({
  users: [
    {
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      access_level: { type: Number, required: true, default: 1 }
    }
  ]
});

const eventClusterSchema = new mongoose.Schema({
  events: [
    {
      event_name: { type: String, required: true },
      event_hours: { type: String, required: true },
      event_date: { type: String, required: true }, 
      start_time: { type: String, required: true },
      event_id: { type: Number, required: true }, 
      participants: { type: [String], default: [] } 
    }
  ]
});

const studentClusterSchema = new mongoose.Schema({
  students: [
    {
      school: { type: String, required: true },
      name: { type: String, required: true },
      dob: { type: Date, required: true },
      sex: { type: String, required: true },
      community: { type: String, required: true },
      minor_community: { type: String, required: true },
      blood_grp: { type: String, required: true },
      mobile_no: { type: Number, required: true },
      roll_no: { 
        type: String, 
        required: true, 
        unique: true, 
        set: v => v.toUpperCase() 
      },
      year_of_join: { type: Number, required: true },
      branch: { type: String, required: true },
      college_email: { type: String, required: true },
      aadhar: { type: Number, required: true },
      father_name: { type: String, required: true },
      address: { type: String, required: true },
      hos_day_scholar: { type: String, required: true },
      events_participated: { type: [Number], default: [] }
    }
  ]
});

const UserCluster = mongoose.model('UserCluster', userClusterSchema);
const StudentCluster = mongoose.model('StudentCluster', studentClusterSchema);
const EventCluster = mongoose.model('EventCluster', eventClusterSchema); // ✅ Fixed naming issue

async function initializeClusters() {
  const userClusterExists = await UserCluster.findOne();
  if (!userClusterExists) {
    await UserCluster.create({ users: [] });
  }

  const studentClusterExists = await StudentCluster.findOne();
  if (!studentClusterExists) {
    await StudentCluster.create({ students: [] });
  }

  const eventClusterExists = await EventCluster.findOne();
  if (!eventClusterExists){
    await EventCluster.create({ events: [] });
  }
}

initializeClusters();

module.exports = { UserCluster, StudentCluster, EventCluster }; // ✅ Fixed export name
