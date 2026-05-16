import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const kycSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  status: String
});

const KYC = mongoose.model('KYC', kycSchema);

async function checkKYCs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const count = await KYC.countDocuments();
    const kycs = await KYC.find();
    console.log(`Total KYCs in DB: ${count}`);
    console.log('KYCs:', JSON.stringify(kycs, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkKYCs();
