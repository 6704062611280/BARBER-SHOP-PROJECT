import { useNavigate } from "react-router-dom";

export default function ShopSetting() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#fffdf9] py-10 px-6 flex justify-center items-start">
            <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-8 border border-gray-100 text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">⚙️ จัดการคิว & สถานะร้าน</h1>
                <p className="text-gray-500 mb-8">หน้านี้กำลังอยู่ในระหว่างการพัฒนา...</p>
                <button 
                    onClick={() => navigate("/")} 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    กลับหน้าแรก
                </button>
            </div>
        </div>
    );
}