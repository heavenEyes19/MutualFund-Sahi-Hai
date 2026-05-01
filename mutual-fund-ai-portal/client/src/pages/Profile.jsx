import { useEffect, useState } from "react";
import API from "../services/api";

export default function Profile() {
  const [user, setUser] = useState(null);

  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panFile, setPanFile] = useState(null);
  const [aadhaarFile, setAadhaarFile] = useState(null);

  // 🔹 Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/users/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setUser(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchUser();
  }, []);

  // 🔹 Submit KYC
  const handleKYCSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("panNumber", panNumber);
      formData.append("aadhaarNumber", aadhaarNumber);
      formData.append("pan", panFile);
      formData.append("aadhaar", aadhaarFile);

      await API.post("/kyc/submit", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      alert("KYC Submitted Successfully");

      // refresh user data
      window.location.reload();

    } catch (err) {
      console.log(err);
      alert("Error submitting KYC");
    }
  };

  if (!user) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* 👤 BASIC INFO */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="text-xl font-semibold mb-2">Profile</h2>
        <p><b>Name:</b> {user.name}</p>
        <p><b>Email:</b> {user.email}</p>
      </div>

      {/* 📊 KYC STATUS */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">KYC Status</h2>

        <p>
          Status:{" "}
          <span className="font-bold">
            {user.kycStatus}
          </span>
        </p>

        <p>
          Verified:{" "}
          {user.isVerified ? "✅ Yes" : "❌ No"}
        </p>
      </div>

      {/* 📄 KYC FORM */}
      {user.kycStatus !== "verified" && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">
            Complete Your KYC
          </h2>

          <form onSubmit={handleKYCSubmit} className="space-y-3">

            <input
              type="text"
              placeholder="PAN Number"
              className="w-full p-2 border rounded"
              onChange={(e) => setPanNumber(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Aadhaar Number"
              className="w-full p-2 border rounded"
              onChange={(e) => setAadhaarNumber(e.target.value)}
              required
            />

            <input
              type="file"
              className="w-full"
              onChange={(e) => setPanFile(e.target.files[0])}
              required
            />

            <input
              type="file"
              className="w-full"
              onChange={(e) => setAadhaarFile(e.target.files[0])}
              required
            />

            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Submit KYC
            </button>
          </form>
        </div>
      )}

      {/* ✅ SHOW DATA IF VERIFIED */}
      {user.kycStatus === "verified" && (
        <div className="bg-green-100 p-4 rounded">
          🎉 Your KYC is verified. You have full access.
        </div>
      )}

    </div>
  );
}