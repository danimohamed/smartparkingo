import ParkingDetailClient from './_components/ParkingDetailClient'

const Page = async ({ params }) => {
    const { id } = await params
    return <ParkingDetailClient parkingId={id} />
}

export default Page

