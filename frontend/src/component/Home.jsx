import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { DataContext } from "../DataContext";
import "./style/Home.css";

export default function Home() {
    const navigate = useNavigate();
    const { islogin } = useContext(DataContext) || {};

    const slidesData = [
        { id: 1, title: "20% off", subtitle: "first haircut", imgSrc: "/images/slide1.jpg" },
        { id: 2, title: "แพ็คเกจคู่สุดคุ้ม", subtitle: "ตัดผม + โกนหนวด รับส่วนลดพิเศษ", imgSrc: "/images/slide2.jpg" },
        { id: 3, title: "บริการทำสีผมใหม่", subtitle: "ตามสไตล์ที่คุณต้องการ", imgSrc: "/images/slide3.jpg" },
    ];

    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = slidesData.length;

    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
    const goToSlide = (index) => setCurrentSlide(index);

    useEffect(() => {
        const interval = setInterval(() => nextSlide(), 5000);
        return () => clearInterval(interval);
    }, [currentSlide]);

    // --- ฟังก์ชันกดปุ่มจองคิว (ดักจับ Role) ---
    const handleBookingClick = () => {
        if (!islogin) {
            // ถ้าเป็น Guest (islogin เป็น false) ไปหน้า login
            navigate('/login');
        } else {
            // ถ้า Login แล้ว (เป็น Customer, Employee, Owner) ไปหน้าจองคิว
            navigate('/chair');
        }
    };

    return (
        <div className="w-full flex flex-col">
            <section className="relative w-full h-[350px] md:h-[450px] bg-gray-900 overflow-hidden">
                <div className="flex transition-transform duration-500 ease-in-out h-full w-full" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {slidesData.map((slide, index) => (
                        <div key={slide.id} className="w-full h-full flex-shrink-0 relative flex items-center justify-center">
                            {slide.imgSrc ? (
                                <img src={slide.imgSrc} alt={`Slide ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                                    <span className="text-gray-600 text-xl md:text-2xl">[ รูปภาพสไลด์ที่ {index + 1} ]</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                            <div className="relative z-10 text-center text-white px-4">
                                <h1 className="text-5xl md:text-7xl font-bold mb-2 drop-shadow-md">{slide.title}</h1>
                                <h2 className="text-4xl md:text-6xl font-bold drop-shadow-md">{slide.subtitle}</h2>
                            </div>
                        </div>
                    ))}
                </div>

                <button onClick={prevSlide} className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 text-white text-5xl hover:scale-110 transition z-20">&lsaquo;</button>
                <button onClick={nextSlide} className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 text-white text-5xl hover:scale-110 transition z-20">&rsaquo;</button>
                
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
                    {slidesData.map((_, index) => (
                        <div key={index} onClick={() => goToSlide(index)} className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${index === currentSlide ? 'bg-[#ff9c2f]' : 'bg-white opacity-70 hover:opacity-100'}`}></div>
                    ))}
                </div>
            </section>

            <section className="w-full py-16 md:py-24 bg-[#fffdf9] flex flex-col items-center">
                <h2 className="text-4xl md:text-5xl font-extrabold text-[#1c2a4f] mb-10 text-center">
                    Sharp Looks, Modern Style
                </h2>
                
                <div className="relative w-full max-w-4xl mx-auto px-6">
                    <div className="w-full h-[250px] md:h-[400px] bg-gray-300 shadow-xl overflow-hidden relative p-6">
                         <div className="relative z-10 text-white font-bold text-xl drop-shadow-lg h-full flex items-end">
                            The <br/> Modern Shave
                         </div>
                    </div>
                    
                    <div className="absolute -bottom-6 right-10 md:bottom-8 md:right-12">
                        {/* เรียกใช้ฟังก์ชันดักจับที่เขียนไว้ */}
                        <button 
                            onClick={handleBookingClick}
                            className="bg-[#ff9c2f] hover:bg-[#ff8a00] text-black font-bold py-3 px-8 rounded border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none"
                        >
                            กดจองคิว<br/>ตอนนี้เลย
                        </button>
                    </div>
                </div>
            </section>
            
        </div>
    );
}