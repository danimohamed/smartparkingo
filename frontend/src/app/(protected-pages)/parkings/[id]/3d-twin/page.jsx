import DigitalTwinClient from './_components/DigitalTwinClient'

const Page = async ({ params }) => {
    const { id } = await params
    return <DigitalTwinClient parkingId={id} />
}

export default Page

