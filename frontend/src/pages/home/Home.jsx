import MessageContainer from "../../components/messages/MessageContainer";
import Sidebar from "../../components/sidebar/Sidebar";

const Home = () => {
  return (
    <div className="flex w-full max-w-6xl h-[85vh] sm:h-[90vh] rounded-2xl shadow-2xl overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 ring-1 ring-white/10">
      <Sidebar />
      <MessageContainer />
    </div>
  );
};

export default Home;