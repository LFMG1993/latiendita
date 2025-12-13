import {FC, useState} from 'react';
import Breadcrumbs from "../../components/general/Breadcrumbs.tsx";
import SalesLineChart from "../../components/dashboard/SalesLineChart.tsx";
import TopProductsBarChart from "../../components/dashboard/TopProductsBarChart.tsx";
import WeekdayRadarChart from "../../components/dashboard/WeekdayRadarChart.tsx";
import MonthYearPicker from "../../components/dashboard/MonthYearPicker.tsx";
import IncomeVsExpensesChart from "../../components/dashboard/IncomeVsExpensesChart.tsx";

const DashboardPage: FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    return (
        <>
            <Breadcrumbs/>
            <div
                className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
                <h1 className="h2">Dashboard</h1>
                <div className="btn-toolbar mb-2 mb-md-0">
                    <MonthYearPicker selectedDate={selectedDate} onChange={setSelectedDate}/>
                </div>
            </div>
            <div className="row g-4">
                <div className="col-lg-7">
                    <div className="card h-100 p-3"><SalesLineChart selectedDate={selectedDate}/></div>
                </div>
                <div className="col-lg-5">
                    <div className="card h-100 p-3"><TopProductsBarChart selectedDate={selectedDate}/></div>
                </div>
                <div className="col-lg-5">
                    <div className="card h-100 p-3"><WeekdayRadarChart selectedDate={selectedDate}/></div>
                </div>
                <div className="col-lg-7">
                    <div className="card h-100 p-3"><IncomeVsExpensesChart selectedDate={selectedDate}/></div>
                </div>
            </div>
        </>
    );
};

export default DashboardPage;