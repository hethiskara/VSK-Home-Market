<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Order extends CI_Controller {

	function __construct()
	{
		parent::__construct();
		$this->common->login_status();
		$this->folder_path = "order/";
		$this->table = "db_shipping_address";
		$this->list_name = "Order Detail";
 		$this->load->model(array('admin/mo_admin_common','admin/mo_sqlz'));
		//$this->common->userPermission('11');
	}

	public function index()
	{
		if($this->input->get('s') == '')
		{
			$s = '1';
		}
		else
		{
			$s = $this->input->get('s');
		}
		$data['s'] 					= $s;
		$config['base_url'] 		= $this->config->item('admin_path').$this->folder_path.'/index/';
		$config['uri_segment']		= 4;
		$offset						= $this->uri->segment(4,0);
		$config['per_page'] 		= $this->config->item('records_per_page');
	$num = $offset;  
		$offset 					= $config['per_page'];
		if (count($_GET) > 0) $config['suffix'] = '?' . http_build_query($_GET, '', "&");
		$config['first_link'] 		= 'First';
		$config['first_tag_open'] 	= '<li>';
		$config['first_tag_close'] 	= '</li>';
		$config['num_tag_open'] 	= '<li>';
		$config['num_tag_close'] 	= '</li>';
		$config['cur_tag_open'] 	= '<li class="active">';
		$config['cur_tag_close'] 	= '</li>';
		$config['prev_link'] 		= 'Previous';
		$config['prev_tag_open'] 	= '<li>';
		$config['prev_tag_close'] 	= '</li>';
		$config['next_link'] 		= 'Next';
		$config['next_tag_open'] 	= '<li>';
		$config['next_tag_close'] 	= '</li>';
		$config['last_link'] 		= 'Last';
		$config['last_tag_open'] 	= '<li>';
		$config['last_tag_close'] 	= '</li>';
		$config['total_rows'] 		= $this->mo_admin_common->rows_countz($this->table,$s);
		$this->pagination->initialize($config);
		$this->load->view("admin/includes/header");
		$data['query'] = $this->mo_admin_common->getOrderPages($num,$offset,$s);
		$this->load->view('admin/'.$this->folder_path.'/list',$data);
		$this->load->view("admin/includes/footer");
	}
	
	function edit()
	{
		$this->load->view("admin/includes/header");
		$ordnum = $this->uri->segment(4);

           $data['query'] = $this->mo_sqlz->rowSelectArray($this->table,'order_number',$ordnum,'');
		
	   $mainpath ="deliveryimages";		
		$this->form_validation->set_rules('delivery_date','Delivery Date','trim|required|xss_clean');
		$this->form_validation->set_rules('delivery_detail','Delivery Detail','trim|required|xss_clean');
		
		if($this->form_validation->run() == false)
		{
		$this->load->view('admin/'.$this->folder_path.'/edit',$data);
		}
		else
		{

		if(!empty($_FILES['userfile']['name']))
			{	
			   		
				$config1['image_library']	= 'gd2';
		 		$config1['upload_path'] 		= $mainpath; 
				$config1['allowed_types'] 	= 'gif|jpg|png|pdf|doc|txt';
				$this->load->library('upload', $config1);
				if ( ! $this->upload->do_upload('userfile'))
				{
					$data['error'] = array('error' => $this->upload->display_errors());
				}
				
			 	$imageData1 = $this->upload->data('userfile'); 
				 $image1 = $imageData1['file_name']; 

            $img_path1 = $imageData1['file_path'].$image1;
			   //$this->image_thumb($img_path2,$image1,'400','300',$imgpath1);
				
				if($image1 == '')
			    {
				   $image = '';
			    }
			    else
			    {
				   $image = $image1; 
			    }
			    }
				else
				{
				 	$image = $data['query'][0]['image'];
				}		



		$data_to_store = array(
				
				'delivery_date' 					=> $this->input->post('delivery_date'),
				'delivery_image' 					=> $image,
				'delivery_detail' 				=> $this->input->post('delivery_detail')
				);
				
			
           if($this->mo_sqlz->update($this->table,'order_number',$ordnum, $data_to_store) == TRUE)
			  { 		
		     $this->session->set_flashdata('message', $this->list_name.' updated successfully');
			  redirect($this->config->item('admin_path').$this->folder_path."index/".$this->uri->segment(5));
		     }
			 else
			   {
			   	 $this->session->set_flashdata('message', 'Please try again');
				    redirect($this->config->item('admin_path').$this->folder_path.'/edit/'.$id);
            }
		
      }
		$this->load->view('admin/includes/footer');
	}
	
	
	
	
	function view()
	{
		$this->load->view("admin/includes/header");
		$ordnum = $this->uri->segment(4);
		//$data['query'] = $this->mo_sqlz->rowSelectArray($this->table,'id',$id,'');
		$this->load->view('admin/'.$this->folder_path.'/view',$data);
		$this->load->view('admin/includes/footer');
	}
	
	
	function sendsms()
	{

		$this->load->view("admin/includes/header");
		$deliveryno = $this->uri->segment(4);
		
$data['delivery_detail'] 	 = $this->mo_sqlz->rowSelectArraynew('db_delivery_details','delivery_no',$deliveryno);
$data['order_detail'] = $this->mo_sqlz->rowSelectArray('db_billing_address','order_number',$data['delivery_detail'][0]['order_number']);
$userid = $data['order_detail'][0]["user_id"];
$data['user_details'] = $this->mo_sqlz->rowSelectArray('db_signup','id',$userid);


	   if($this->input->server('REQUEST_METHOD') === 'POST')			
		  {	
			//echo $data['user_details'][0]['mobile_no'];		
	      //echo $this->input->post('delivery_details'); exit;
	      
	        $update = "UPDATE db_delivery_details SET `sms_status`='1' WHERE `delivery_no`='".$deliveryno."'"; 
	        $updateExe = mysql_query($update) or die(mysql_error());
	        
	        $smsdetails = $this->input->post('delivery_details');
			$this->sms->sendSms($data['user_details'][0]['mobile_no'],$smsdetails);	
			$this->session->set_flashdata('success_msg', 'SMS Delivered Successfully');
			redirect($this->config->item('admin_path').$this->folder_path.'delivery_details'.'/'.$data['delivery_detail'][0]['order_number']);
	      }

		$this->load->view('admin/'.$this->folder_path.'/sendsms',$data);
		$this->load->view('admin/includes/footer');
	}
	
	
	

	function detail()
	{
		$this->load->view("admin/includes/header");
		$ordnum = $this->uri->segment(4);

		$data['order_detail'] = $this->mo_sqlz->rowSelectArray('db_shipping_address','order_number',$ordnum);
		$userid = $data['order_detail'][0]["user_id"];
		$data['billing_address'] = $this->mo_sqlz->rowSelectArray('db_signup','id',$userid);
		
		$data['cart_detail'] 	 = $this->mo_sqlz->rowSelectArraynew('db_cart','order_number',$ordnum);		

		$this->load->view('admin/'.$this->folder_path.'/detail',$data);
		$this->load->view('admin/includes/footer');
	}

function delivery_details()
	{
		$this->load->view("admin/includes/header");
		$ordnum = $this->uri->segment(4);
		$data['order_detail'] = $this->mo_sqlz->rowSelectArray('db_billing_address','order_number',$ordnum);
		$userid = $data['order_detail'][0]["user_id"];
		$data['billing_address'] = $this->mo_sqlz->rowSelectArray('db_signup','id',$userid);
		$data['cart_detail'] 	 = $this->mo_sqlz->rowSelectArraynew('db_cart','order_number',$ordnum);		
		
		$deliverytable = 'db_delivery_details'; 
		$data['delivery_details'] = $this->mo_admin_common->getDeliveryPages($deliverytable,'order_number',$ordnum);
		$this->load->view('admin/'.$this->folder_path.'/delivery_detailslist',$data);
		$this->load->view('admin/includes/footer');
	}
	
	
	
	
	function delivery_detailsadd()
{
    $this->load->view("admin/includes/header");
    $mainpath ="deliveryimages";
    
    if($this->input->server('REQUEST_METHOD') === 'POST')
    {
        $this->form_validation->set_rules('product_name','Product Name','required|xss_clean');

        if($this->form_validation->run())
        {
            if(!empty($_FILES['userfile']['name']))
            {   
                $config1['image_library'] = 'gd2';
                $config1['upload_path']   = $mainpath; 
                $config1['allowed_types'] = 'gif|jpg|png|pdf|doc|txt';
                $this->load->library('upload', $config1);

                if (!$this->upload->do_upload('userfile'))
                {
                    $data['error'] = array('error' => $this->upload->display_errors());
                }

                $imageData1 = $this->upload->data('userfile'); 
                $image1 = $imageData1['file_name']; 

                if($image1 == '')
                    $image = '';
                else
                    $image = $image1; 
            }

            $product_id = implode(',',$this->input->post('product_name'));

            $data_to_store = array(
                'order_number'   => $this->uri->segment(4),
                'product_id'     => $product_id,
                'delivery_date'  => $this->input->post('delivery_date'),
                'delivery_proof_image' => $image,
                'order_placed_details' => $this->input->post('placed_detail'),      
                'order_packaged_details' => $this->input->post('packaged_detail'),              
                'order_shipped_details' => $this->input->post('shipped_detail'),               
                'order_delivered_details' => $this->input->post('delivered_detail'),                      
                'created_date'  => date("Y-m-d"),
                'deliverychallannumber' => $this->input->post('deliverychallan'),
                'Trackinglink' => $this->input->post('Trackinglink'),
            );

            $table_name = 'db_delivery_details';

            if($this->mo_sqlz->insert($table_name,$data_to_store))
            {       
                $insert_id = $this->db->insert_id();

                $delivery_no = $this->input->post('order_no').'-'.'D'.$insert_id;
                $update = "UPDATE db_delivery_details 
                           SET delivery_no = '".$delivery_no."' 
                           WHERE delivery_id='".$insert_id."'";   
                $this->db->query($update);     

                // ===============================
                // 🔥 PUSH NOTIFICATION START HERE
                // ===============================
$this->load->helper('fcm_helper');
$order_no = $this->uri->segment(4);
 
$order_detail = $this->mo_sqlz->rowSelectArray(
    'db_delivery_details',
    'order_number',
    $order_no
);

 

if(!empty($order_detail))
{
    
     	$selproductname = "SELECT * FROM db_shipping_address WHERE `status`='1' AND `order_number`='".$order_no."'"; 
		$selproductnameExe = $this->db->query($selproductname);
		$menkanid = $selproductnameExe->result_array();
    
    $user_id = $menkanid[0]['user_id'];
    $fcm = $this->db
            ->get_where('user_fcm_tokens', ['user_id' => $user_id])
            ->row_array();
            
     

    if(!empty($fcm['fcm_token']))
    {
        $title = "Order Update";
        $body  = "Your order ".$order_no." updated";

        $dataPayload = [
            'type' => 'order_update',
            'order_number' => $order_no
        ];

        $response = send_fcm_notification(
            $fcm['fcm_token'],
            $title,
            $body,
            $dataPayload
        );

        echo "<pre>";
        print_r($response);
        exit;
    }
}

                // ==============================
                // 🔥 PUSH NOTIFICATION END
                // ==============================


                $this->session->set_flashdata('success_msg', 'Delivery details added');
                redirect($this->config->item('admin_path').$this->folder_path.'delivery_details'.'/'.$this->uri->segment(4));
            }
            else
            {
                $this->session->set_flashdata('error_msg', 'Something went wrong please try again');
                redirect($this->config->item('admin_path').$this->folder_path.'delivery_detailsadd'.'/'.$this->uri->segment(4));
            }
        }
    }

    $ordnum = $this->uri->segment(4);
    
    $data['order_detail'] = $this->mo_sqlz->rowSelectArray('db_billing_address','order_number',$ordnum);
    $userid = $data['order_detail'][0]["user_id"];
    $data['billing_address'] = $this->mo_sqlz->rowSelectArray('db_signup','id',$userid);
    
    $data['cart_detail'] = $this->mo_sqlz->rowSelectArraynew('db_cart','order_number',$ordnum);         
    $this->load->view('admin/order/delivery_detailsadd',$data);
    
    $this->load->view("admin/includes/footer");
}

	
	
	
	
		function delivery_detailsaddZOLD()
	{

		$this->load->view("admin/includes/header");
		$mainpath ="deliveryimages";
		
		if($this->input->server('REQUEST_METHOD') === 'POST')
		{
			$this->form_validation->set_rules('product_name','Product Name','required|xss_clean');
		/*	$this->form_validation->set_rules('delivery_date','Delivery Date','trim|required|xss_clean');
			$this->form_validation->set_rules('placed_detail','Order Placed Detail','trim|required|xss_clean');
			$this->form_validation->set_rules('packaged_detail','Order Packaged Detail','trim|required|xss_clean');
			$this->form_validation->set_rules('shipped_detail','Order Shipped Detail','trim|required|xss_clean');
		   $this->form_validation->set_rules('delivered_detail','Order Delivered Detail','trim|required|xss_clean');*/
         
			if($this->form_validation->run())
			{
				
				if(!empty($_FILES['userfile']['name']))
			{	
			   		
				$config1['image_library']	= 'gd2';
		 		$config1['upload_path'] 		= $mainpath; 
				$config1['allowed_types'] 	= 'gif|jpg|png|pdf|doc|txt';
				$this->load->library('upload', $config1);
				if ( ! $this->upload->do_upload('userfile'))
				{
					$data['error'] = array('error' => $this->upload->display_errors());
				}
				
			 	$imageData1 = $this->upload->data('userfile'); 
				 $image1 = $imageData1['file_name']; 

            $img_path1 = $imageData1['file_path'].$image1;
			   //$this->image_thumb($img_path2,$image1,'400','300',$imgpath1);
				
				if($image1 == '')
			    {
				   $image = '';
			    }
			    else
			    {
				   $image = $image1; 
			    }
			    }
				
				$product_id = implode(',',$this->input->post('product_name'));

					    	  
				$data_to_store         = array(
				'order_number'   => $this->uri->segment(4),
				'product_id'      => $product_id,
				'delivery_date'   => $this->input->post('delivery_date'),
				'delivery_proof_image' => $image,
				'order_placed_details' => $this->input->post('placed_detail'),		
				'order_packaged_details' => $this->input->post('packaged_detail'),				
				'order_shipped_details' => $this->input->post('shipped_detail'),				
				'order_delivered_details' => $this->input->post('delivered_detail'),						
				'created_date'	=> date("Y-m-d"),
				'deliverychallannumber ' => $this->input->post('deliverychallan'),
				'Trackinglink ' => $this->input->post('Trackinglink'),
				);
                                 				
				$table_name = 'db_delivery_details';
				//print_r($data_to_store);exit;
				if($this->mo_sqlz->insert($table_name,$data_to_store))
				{		
 						$insert_id = $this->db->insert_id();
				$delivery_no = $this->input->post('order_no').'-'.'D'.$insert_id;
				 $update = "UPDATE db_delivery_details SET
            `delivery_no` = '".$delivery_no."' WHERE `delivery_id`='".$insert_id."'"; 	
	         $updateExe =$this->db->query($update);		
	         
	         
	         
	         
	         
						
				
		$data['order_detail'] = $this->mo_sqlz->rowSelectArray('db_billing_address','order_number',$this->uri->segment(4));
		$userid = $data['order_detail'][0]["user_id"];
		$data['user_details'] = $this->mo_sqlz->rowSelectArray('db_signup','id',$userid);
				//echo $data['user_details'][0]['mobile_no'];
		
		$delivereditems = count($this->input->post('product_name'));

	
					$this->session->set_flashdata('success_msg', 'Category created successfully');
					redirect($this->config->item('admin_path').$this->folder_path.'delivery_details'.'/'.$this->uri->segment(4));
				}
				else
				{
						$insert_id = $this->db->insert_id();
					$this->session->set_flashdata('error_msg', 'Something went wrong please try again');
					redirect($this->config->item('admin_path').$this->folder_path.'delivery_detailsadd'.'/'.$this->uri->segment(4));
				}
							
						
			}
		}
		$ordnum = $this->uri->segment(4);
		
		$data['order_detail'] = $this->mo_sqlz->rowSelectArray('db_billing_address','order_number',$ordnum);
		$userid = $data['order_detail'][0]["user_id"];
		$data['billing_address'] = $this->mo_sqlz->rowSelectArray('db_signup','id',$userid);
		
		$data['cart_detail'] 	 = $this->mo_sqlz->rowSelectArraynew('db_cart','order_number',$ordnum);			
		$this->load->view('admin/order/delivery_detailsadd',$data);
		
		
		$this->load->view("admin/includes/footer");
	}
	


function delivery_detailsedit()
	{
		$this->load->view("admin/includes/header");
		$table_name = 'db_delivery_details';
		$ordnum = $this->uri->segment(4);
		$delivery_id = $this->uri->segment(5);
		
		$data['order_detail'] = $this->mo_sqlz->rowSelectArray('db_billing_address','order_number',$ordnum);
		$userid = $data['order_detail'][0]["user_id"];
		$data['billing_address'] = $this->mo_sqlz->rowSelectArray('db_signup','id',$userid);
		
		$data['cart_detail'] 	 = $this->mo_sqlz->rowSelectArraynew('db_cart','order_number',$ordnum);	
      $data['query'] = $this->mo_sqlz->rowSelectArray($table_name,'delivery_id',$delivery_id);
		
	   $mainpath ="deliveryimages";		
		   $this->form_validation->set_rules('product_name','Product Name','required|xss_clean');
			/*$this->form_validation->set_rules('delivery_date','Delivery Date','trim|required|xss_clean');
			$this->form_validation->set_rules('placed_detail','Order Placed Detail','trim|required|xss_clean');
			$this->form_validation->set_rules('packaged_detail','Order Packaged Detail','trim|required|xss_clean');
			$this->form_validation->set_rules('shipped_detail','Order Shipped Detail','trim|required|xss_clean');
		   $this->form_validation->set_rules('delivered_detail','Order Delivered Detail','trim|required|xss_clean');*/
		
		if($this->form_validation->run() == false)
		{
		 $this->load->view('admin/'.$this->folder_path.'/delivery_detailsedit',$data);
		}
		else
		{

		if(!empty($_FILES['userfile']['name']))
			{	
			   		
				$config1['image_library']	= 'gd2';
		 		$config1['upload_path'] 		= $mainpath; 
				$config1['allowed_types'] 	= 'gif|jpg|png|pdf|doc|txt';
				$this->load->library('upload', $config1);
				if ( ! $this->upload->do_upload('userfile'))
				{
					$data['error'] = array('error' => $this->upload->display_errors());
				}
				
			 	$imageData1 = $this->upload->data('userfile'); 
				 $image1 = $imageData1['file_name']; 

            $img_path1 = $imageData1['file_path'].$image1;
			   //$this->image_thumb($img_path2,$image1,'400','300',$imgpath1);
				
				if($image1 == '')
			    {
				   $image = '';
			    }
			    else
			    {
				   $image = $image1; 
			    }
			    }
				else
				{
				 	$image = $data['query'][0]['delivery_proof_image'];
				}		

				$product_id = implode(',',$this->input->post('product_name'));

		$data_to_store = array(				
				'product_id'      => $product_id,
				'delivery_date'   => $this->input->post('delivery_date'),
				'delivery_proof_image' => $image,
				'order_placed_details' => $this->input->post('placed_detail'),		
				'order_packaged_details' => $this->input->post('packaged_detail'),				
				'order_shipped_details' => $this->input->post('shipped_detail'),				
				'deliverychallannumber' => $this->input->post('deliverychallan'),
				'Trackinglink' => $this->input->post('Trackinglink')
				
			); 
				
		$data['user_details'] = $this->mo_sqlz->rowSelectArray('db_signup','id',$userid);
		//echo $data['user_details'][0]['mobile_no'];
		
		$delivereditems = count($this->input->post('product_name'));
       // print_r($data_to_store);exit;
           if($this->mo_sqlz->update($table_name,'delivery_id',$delivery_id, $data_to_store) == TRUE)
			  { 
			      
		     $this->session->set_flashdata('message', $this->list_name.' updated successfully');
			  //redirect($this->config->item('admin_path').$this->folder_path."index/".$this->uri->segment(5));
			  redirect($this->config->item('admin_path').$this->folder_path.'delivery_details'.'/'.$this->uri->segment(4));
		     }
			 else
			   {
			   	 $this->session->set_flashdata('message', 'Please try again');
				    redirect($this->config->item('admin_path').$this->folder_path.'/delivery_detailsedit/'.$this->uri->segment(4));
            }
		
		
		
		
		
      }
		$this->load->view('admin/includes/footer');
	}


	function active()
	{
		$id = $this->uri->segment(4);
		$data_to_store = array('status'	=> '1');

		if($this->mo_sqlz->update($this->table,'order_number',$id, $data_to_store) == TRUE)
		{
			$this->session->set_flashdata('message', $this->list_name.' published successfully');
			redirect($this->config->item('admin_path').$this->folder_path);

		}
		else
		{
			$this->session->set_flashdata('message', 'Please try again Later');
			redirect($this->admin_path.$this->folder_path.'/edit/'.$id);

		}
	}

	function deactive()
	{
		$id = $this->uri->segment(4);
		$data_to_store = array('status'	=> '0');

		if($this->mo_sqlz->update($this->table,'order_number',$id, $data_to_store) == TRUE)
		{
			$this->session->set_flashdata('message', $this->list_name.' blocked successfully');
			redirect($this->config->item('admin_path').$this->folder_path);

		}
		else
		{
			$this->session->set_flashdata('message', 'Please try again Later');
			redirect($this->admin_path.$this->folder_path.'/edit/'.$id);

		}
	}
	
	function delete()
	{
		$id = $this->uri->segment(4);
		$data_to_store = array('status'	=> '2');

		if($this->mo_sqlz->update($this->table,'order_number',$id, $data_to_store) == TRUE)
		{
			$this->session->set_flashdata('message', $this->list_name.' deleted successfully');
			redirect($this->config->item('admin_path').$this->folder_path."index/".$this->uri->segment(5));

		}
		else
		{
			$this->session->set_flashdata('message', 'Please try again Later');
			redirect($this->admin_path.$this->folder_path.'/edit/'.$id);

		}
	}
	
	
	
	
	
	
	
	
	
	
	
public function generate_pdf() {
    ob_start();
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    // Load TCPDF library
    require_once APPPATH . 'third_party/TCPDF-main/tcpdf.php';
    	$ordnum = $this->uri->segment(4);

		$order_detail = $this->mo_sqlz->rowSelectArray('db_shipping_address','order_number',$ordnum);
		$userid = $order_detail[0]["user_id"];
		$billing_address = $this->mo_sqlz->rowSelectArray('db_signup','id',$userid);
		$sectagdetail3 	 = $this->mo_sqlz->rowSelectArraynew('db_cart','order_number',$ordnum);	
		$cart_detail 	 = $this->mo_sqlz->rowSelectArraynew('db_cart','order_number',$ordnum);	
    // Fetch cart items for the provided order ID
    $sectionSelect1 = "SELECT * FROM db_shipping_address WHERE `order_number` = '" . $ordnum . "'    and `user_id` = '".$userid."'";
    $tagSelectExe1 = $this->db->query($sectionSelect1);
    $sectagdetail2 = $tagSelectExe1->result_array();
    if (empty($sectagdetail2)) {
        echo 'No items found for the given Order ID!';
        return;
    }
    // Fetch contact details
    $sectionSelect3 = "SELECT * FROM db_contactus WHERE `status` = '1'";
    $tagSelectExe3 = $this->db->query($sectionSelect3);
    $sectagdetail4 = $tagSelectExe3->result_array();
 
    // Create a new PDF document
    $pdf = new TCPDF();
    $pdf->SetCreator(PDF_CREATOR);
    $pdf->SetAuthor('Your Company');
    $pdf->SetTitle('Invoice PDF');
    $pdf->SetSubject('Invoice');
    $pdf->SetKeywords('TCPDF, PDF, invoice, example');
    // Set margins and page setup
    $pdf->SetAutoPageBreak(TRUE, PDF_MARGIN_BOTTOM);
    $pdf->AddPage();
    // Set font to DejaVu Sans
    $pdf->SetFont('dejavuserif', '', 'dejavuserif.php'); 
    // Initialize variables
    $subtotal = 0;
    $totalTax = 0;
     $dispercents = 0;
     $gtot=0;
    $sno =0;
    $shippingcost = 0;

    // HTML content for the invoice
    $html = '
<table style=" border-collapse: collapse;width: 100%;">
  <tr>
    <th> <img src="https://www.vskhomemarket.com/images/logoc.png" alt="Logo" style="width: 110px; height: auto;"></th>
    <th style="text-align:right;font-size:10px;line-height:16px;">' . $sectagdetail4[0]['pagecontent'] . '</th>
    </tr>
    <tr>
    <td colspan="2"><hr style="border: 1px solid #000;size:1px;"></td>
</tr>
      <tr>
    <td style="text-align:left;font-size:8px;line-height:15px;">Invoice: <b>INV' . str_pad($sectagdetail2[0]['order_number'], 5, '0', STR_PAD_LEFT) . '</b></td>
    <td style="text-align:right;font-size:8px;line-height:15px;">Order Date: <b>' . date('d/m/Y', strtotime($sectagdetail2[0]['created_date'])) . '</b></td>
    </tr>
    <tr>
    <td style="text-align:left;font-size:8px;line-height:8px;height:15px;">Payment ID:<b> ' . $sectagdetail2[0]['onlinepaymentid'] . ' </b></td>
    <td style="text-align:right;font-size:8px;line-height:8px;height:15px;">Order ID:<b> ' . $sectagdetail2[0]['order_number'] . '</b></td>
    </tr>
      <tr>
    <td style="text-align:left;font-size:9px;line-height:15px;"><b>Billing Information:</b><br>
<span style="text-align:left;font-size:8px;line-height:12px;">' . $billing_address[0]['firstname'] . ' ' . $billing_address[0]['lastname'] . '<br>
' . $billing_address[0]['address'] . '<br>
' . $billing_address[0]['city'] . ' - ' . $billing_address[0]['postalcode'] . ' <br>
'.$billing_address[0]['country'] . ' - ' . $billing_address[0]['state'] . ' <br>
' . $billing_address[0]['mobile_no'] . '<br>
</span>
    </td>
    <td style="text-align:left;font-size:9px;line-height:15px;"><b>Shipping Information:</b><br>
<span style="text-align:left;font-size:8px;line-height:12px;">' . $order_detail[0]['firstname'] . ' ' . $order_detail[0]['lastname'] . '<br>
' . $order_detail[0]['address'] . '<br>
' . $order_detail[0]['city'] . ' - ' . $order_detail[0]['postalcode'] . ' <br>
'.$order_detail[0]['country'] . ' - ' . $order_detail[0]['state'] . ' <br>
' . $order_detail[0]['mobilephone'] . '<br>
</span>
    </td>
    </tr>
</table>
<table style="border-collapse: collapse;width: 87%;font-size:10px;">
            <tr>
                    <th style="width:6%;border: 1px solid #ddd;height:20px;line-height: 15px;font-weight:bold;font-size:8px;">S.no</th>
                    <th style="width:55%;text-align:center;border: 1px solid #ddd;height:20px;line-height: 15px;font-weight:bold;font-size:8px">Product detail</th>
                    <th style="width:16%;text-align:center;border: 1px solid #ddd;height:20px;font-weight:bold;line-height: 15px;font-size:8px">Quantity</th>
                    <th style="width:9%;border: 1px solid #ddd;height:20px;font-weight:bold;line-height: 15px;font-size:8px">Tax (%)</th>
                     <th style="width:14%;border: 1px solid #ddd;height:20px;font-weight:bold;line-height: 15px;font-size:8px">Discount  (%)</th>
                    <th style="width:15%;text-align:center;border: 1px solid #ddd;height:20px;font-weight:bold;line-height: 15px;font-size:8px"> Price ₹</th>
                    
                 </tr>
            <tbody>';
    // Loop through cart items and calculate totals
    foreach ($cart_detail as $purchase) {
       
        $sno++;
        
$day = "SELECT hidden_discount,status,payment_status,product_code FROM db_cart WHERE `status`='1' AND `payment_status`='1' AND `product_code`='".$purchase["product_code"]."' AND `order_number`='".$purchase['order_number']."'"; 
$SelExe1 = $this->db->query($day);
$dayto = $SelExe1->result_array();
        
        if($purchase['product_type'] == 'garments') 
{
		$select ="SELECT * FROM db_garmentproduct WHERE `id` = '".$purchase["product_id"]."'";
		$selectex =  $this->db->query($select);
		$selefet =  $selectex->result_array();
				
		$imgSelect    = "SELECT * FROM db_garmentbarqty WHERE `product_id`='".$selefet[0]["id"]."' AND `bitem_id`='".$selefet[0]["product_code"]."' AND `product_color`='".$purchase["color"]."' AND `size`='".$purchase["size"]."'";
      $imgSelectExe =   $this->db->query($imgSelect);
      $imgFetch = $imgSelectExe->result_array();

		$productimagessel ="SELECT * FROM db_garmentimages WHERE `product_upload_id` = '".$selefet[0]['product_code']."'";
		$productimagesExe = $this->db->query($productimagessel);
		$productimages = $productimagesExe->result_array();
}
else 
{
        $select ="SELECT * FROM db_newproduct WHERE `id` = '".$purchase["product_id"]."'";
		$selectex = $this->db->query($select);
		$selefet =  $selectex->result_array();
				
		$imgSelect    = "SELECT * FROM db_barqty WHERE `product_id`='".$selefet[0]["id"]."' AND `bitem_id`='".$selefet[0]["product_code"]."' AND `product_color`='".$purchase["color"]."' AND `size`='".$purchase["size"]."'";
        $imgSelectExe = $this->db->query($imgSelect);
        $imgFetch = $imgSelectExe->result_array();

		$productimagessel ="SELECT * FROM db_productimages WHERE `product_upload_id` = '".$selefet[0]['product_code']."'";
		$productimagesExe =  $this->db->query($productimagessel);
		$productimages =$productimagesExe->result_array();
}




if (!empty($dayto) && isset($dayto[0]['hidden_discount'])) {
    $dispercent = $dayto[0]['hidden_discount'];
} else {
    $dispercent = 0;
}
$dispercents = ($dispercent != '' && $dispercent != '0') ? $dispercent : 0;





if($imgFetch[0]["selling_ctamt_tax"]!='' && $imgFetch[0]["selling_stamt_tax"]!='') { 
$totaltax = $imgFetch[0]["selling_ctamt_tax"] + $imgFetch[0]["selling_stamt_tax"];
$tax = $totaltax;
 } else if($imgFetch[0]["selling_ctamt_tax"]!='') {
$totaltax = $imgFetch[0]["selling_ctamt_tax"];	$tax = $totaltax;
} 
else if($imgFetch[0]["selling_stamt_tax"]!='') {
$totaltax = $imgFetch[0]["selling_stamt_tax"];	$tax = $totaltax;
 } else { $tax = 0;
}




$prod_price       = $purchase["product_price"];
$curtot1    = $purchase["quantity"] * $purchase["product_price"];  
$disamt1 = ($curtot1/100)*$dispercent;
$tamt = $curtot1 - $disamt1;
$taxamt = ($tamt/100)*$tax;
$totalamt = $tamt + $taxamt;
$prod_whole_price = $totalamt;
$subtotal += $prod_whole_price;
$shippingcost=$sectagdetail2[0]['sc'];
$gtot=$subtotal+$shippingcost;

        $html .= '
        <tr>
            <td style="width: 6%;border: 1px solid #ddd;line-height:20px;">' .$sno. '</td>
            <td style="width: 55%;border: 1px solid #ddd;line-height:20px;">' . $purchase['product_name'] . '</td>
            <td style="width:16%;border: 1px solid #ddd;line-height:20px;">'. $purchase['quantity'] . ' X ' . number_format($prod_price, 2). '</td>
             <td style="width:9%;text-align:right;border: 1px solid #ddd;line-height:20px;">' .$totaltax. '%</td>
              <td style="width:14%;text-align:right;border: 1px solid #ddd;line-height:20px;">' .$dispercents. '%</td>
            <td style="width:15%;text-align:right;border: 1px solid #ddd;line-height:20px;">' . number_format($prod_whole_price,2) . '</td>
         </tr>';
    }
 
    $html .= '
            </tbody>
        </table>
 <table style=" border-collapse: collapse;width: 100%;font-size:10px;padding:10px 0 0 0;">
<tr style="padding-top: 1px;text-align:right;line-height:10px;">
<td></td>
<td></td>
<td></td>
<td style="text-align:right;font-size:9px;line-height:15px;"><span>Subtotal ₹ :</span> <span><b>' . number_format($subtotal ,2) . '</b></span><br>
<span>Shipping Cost ₹ :</span> <span><b>' . number_format($shippingcost, 2) . '</b></span><br>
<span>Grand Total ₹ :</span> <span><b>' . round($gtot) . '</b></span><br></td>
        </tr>
        </table>
 ';
    // Output the content
    $pdf->writeHTML($html, true, false, true, false, '');
    // Send the PDF as a download
    $pdf->IncludeJS("print(true);");
    $pdf->Output('Invoice_' . $sectagdetail2[0]['order_number'] . '.pdf', 'I');
ob_end_flush();
}

	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
public function generate_pdf_whatsapp($ordnum) {
    ob_start();
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    // Load TCPDF library
    require_once APPPATH . 'third_party/TCPDF-main/tcpdf.php';
    	$ordnum = $this->uri->segment(4);

		$order_detail = $this->mo_sqlz->rowSelectArray('db_shipping_address','order_number',$ordnum);
		$userid = $order_detail[0]["user_id"];
		$billing_address = $this->mo_sqlz->rowSelectArray('db_signup','id',$userid);
		$sectagdetail3 	 = $this->mo_sqlz->rowSelectArraynew('db_cart','order_number',$ordnum);	
		$cart_detail 	 = $this->mo_sqlz->rowSelectArraynew('db_cart','order_number',$ordnum);	
    // Fetch cart items for the provided order ID
    $sectionSelect1 = "SELECT * FROM db_shipping_address WHERE `order_number` = '" . $ordnum . "'    and `user_id` = '".$userid."'";
    $tagSelectExe1 = $this->db->query($sectionSelect1);
    $sectagdetail2 = $tagSelectExe1->result_array();
    if (empty($sectagdetail2)) {
        echo 'No items found for the given Order ID!';
        return;
    }
    // Fetch contact details
    $sectionSelect3 = "SELECT * FROM db_contactus WHERE `status` = '1'";
    $tagSelectExe3 = $this->db->query($sectionSelect3);
    $sectagdetail4 = $tagSelectExe3->result_array();
 
    // Create a new PDF document
    $pdf = new TCPDF();
    $pdf->SetCreator(PDF_CREATOR);
    $pdf->SetAuthor('Your Company');
    $pdf->SetTitle('Invoice PDF');
    $pdf->SetSubject('Invoice');
    $pdf->SetKeywords('TCPDF, PDF, invoice, example');
    // Set margins and page setup
    $pdf->SetAutoPageBreak(TRUE, PDF_MARGIN_BOTTOM);
    $pdf->AddPage();
    // Set font to DejaVu Sans
    $pdf->SetFont('dejavuserif', '', 'dejavuserif.php'); 
    // Initialize variables
    $subtotal = 0;
    $totalTax = 0;
     $dispercents = 0;
     $gtot=0;
    $sno =0;
    $shippingcost = 0;

    // HTML content for the invoice
    $html = '
<table style=" border-collapse: collapse;width: 100%;">
  <tr>
    <th> <img src="https://www.vskhomemarket.com/images/logoc.png" alt="Logo" style="width: 110px; height: auto;"></th>
    <th style="text-align:right;font-size:10px;line-height:16px;">' . $sectagdetail4[0]['pagecontent'] . '</th>
    </tr>
    <tr>
    <td colspan="2"><hr style="border: 1px solid #000;size:1px;"></td>
</tr>
      <tr>
    <td style="text-align:left;font-size:8px;line-height:15px;">Invoice: <b>INV' . str_pad($sectagdetail2[0]['order_number'], 5, '0', STR_PAD_LEFT) . '</b></td>
    <td style="text-align:right;font-size:8px;line-height:15px;">Order Date: <b>' . date('d/m/Y', strtotime($sectagdetail2[0]['created_date'])) . '</b></td>
    </tr>
    <tr>
    <td style="text-align:left;font-size:8px;line-height:8px;height:15px;">Payment ID:<b> ' . $sectagdetail2[0]['onlinepaymentid'] . ' </b></td>
    <td style="text-align:right;font-size:8px;line-height:8px;height:15px;">Order ID:<b> ' . $sectagdetail2[0]['order_number'] . '</b></td>
    </tr>
      <tr>
    <td style="text-align:left;font-size:9px;line-height:15px;"><b>Billing Information:</b><br>
<span style="text-align:left;font-size:8px;line-height:12px;">' . $billing_address[0]['firstname'] . ' ' . $billing_address[0]['lastname'] . '<br>
' . $billing_address[0]['address'] . '<br>
' . $billing_address[0]['city'] . ' - ' . $billing_address[0]['postalcode'] . ' <br>
'.$billing_address[0]['country'] . ' - ' . $billing_address[0]['state'] . ' <br>
' . $billing_address[0]['mobile_no'] . '<br>
</span>
    </td>
    <td style="text-align:left;font-size:9px;line-height:15px;"><b>Shipping Information:</b><br>
<span style="text-align:left;font-size:8px;line-height:12px;">' . $order_detail[0]['firstname'] . ' ' . $order_detail[0]['lastname'] . '<br>
' . $order_detail[0]['address'] . '<br>
' . $order_detail[0]['city'] . ' - ' . $order_detail[0]['postalcode'] . ' <br>
'.$order_detail[0]['country'] . ' - ' . $order_detail[0]['state'] . ' <br>
' . $order_detail[0]['mobilephone'] . '<br>
</span>
    </td>
    </tr>
</table>
<table style="border-collapse: collapse;width: 87%;font-size:10px;">
            <tr>
                    <th style="width:6%;border: 1px solid #ddd;height:20px;line-height: 15px;font-weight:bold;font-size:8px;">S.no</th>
                    <th style="width:55%;text-align:center;border: 1px solid #ddd;height:20px;line-height: 15px;font-weight:bold;font-size:8px">Product detail</th>
                    <th style="width:16%;text-align:center;border: 1px solid #ddd;height:20px;font-weight:bold;line-height: 15px;font-size:8px">Quantity</th>
                    <th style="width:9%;border: 1px solid #ddd;height:20px;font-weight:bold;line-height: 15px;font-size:8px">Tax (%)</th>
                     <th style="width:14%;border: 1px solid #ddd;height:20px;font-weight:bold;line-height: 15px;font-size:8px">Discount  (%)</th>
                    <th style="width:15%;text-align:center;border: 1px solid #ddd;height:20px;font-weight:bold;line-height: 15px;font-size:8px"> Price ₹</th>
                    
                 </tr>
            <tbody>';
    // Loop through cart items and calculate totals
    foreach ($cart_detail as $purchase) {
       
        $sno++;
        
$day = "SELECT hidden_discount,status,payment_status,product_code FROM db_cart WHERE `status`='1' AND `payment_status`='1' AND `product_code`='".$purchase["product_code"]."' AND `order_number`='".$purchase['order_number']."'"; 
$SelExe1 = $this->db->query($day);
$dayto = $SelExe1->result_array();
        
        if($purchase['product_type'] == 'garments') 
{
		$select ="SELECT * FROM db_garmentproduct WHERE `id` = '".$purchase["product_id"]."'";
		$selectex =  $this->db->query($select);
		$selefet =  $selectex->result_array();
				
		$imgSelect    = "SELECT * FROM db_garmentbarqty WHERE `product_id`='".$selefet[0]["id"]."' AND `bitem_id`='".$selefet[0]["product_code"]."' AND `product_color`='".$purchase["color"]."' AND `size`='".$purchase["size"]."'";
      $imgSelectExe =   $this->db->query($imgSelect);
      $imgFetch = $imgSelectExe->result_array();

		$productimagessel ="SELECT * FROM db_garmentimages WHERE `product_upload_id` = '".$selefet[0]['product_code']."'";
		$productimagesExe = $this->db->query($productimagessel);
		$productimages = $productimagesExe->result_array();
}
else 
{
        $select ="SELECT * FROM db_newproduct WHERE `id` = '".$purchase["product_id"]."'";
		$selectex = $this->db->query($select);
		$selefet =  $selectex->result_array();
				
		$imgSelect    = "SELECT * FROM db_barqty WHERE `product_id`='".$selefet[0]["id"]."' AND `bitem_id`='".$selefet[0]["product_code"]."' AND `product_color`='".$purchase["color"]."' AND `size`='".$purchase["size"]."'";
        $imgSelectExe = $this->db->query($imgSelect);
        $imgFetch = $imgSelectExe->result_array();

		$productimagessel ="SELECT * FROM db_productimages WHERE `product_upload_id` = '".$selefet[0]['product_code']."'";
		$productimagesExe =  $this->db->query($productimagessel);
		$productimages =$productimagesExe->result_array();
}




if (!empty($dayto) && isset($dayto[0]['hidden_discount'])) {
    $dispercent = $dayto[0]['hidden_discount'];
} else {
    $dispercent = 0;
}
$dispercents = ($dispercent != '' && $dispercent != '0') ? $dispercent : 0;





if($imgFetch[0]["selling_ctamt_tax"]!='' && $imgFetch[0]["selling_stamt_tax"]!='') { 
$totaltax = $imgFetch[0]["selling_ctamt_tax"] + $imgFetch[0]["selling_stamt_tax"];
$tax = $totaltax;
 } else if($imgFetch[0]["selling_ctamt_tax"]!='') {
$totaltax = $imgFetch[0]["selling_ctamt_tax"];	$tax = $totaltax;
} 
else if($imgFetch[0]["selling_stamt_tax"]!='') {
$totaltax = $imgFetch[0]["selling_stamt_tax"];	$tax = $totaltax;
 } else { $tax = 0;
}




$prod_price       = $purchase["product_price"];
$curtot1    = $purchase["quantity"] * $purchase["product_price"];  
$disamt1 = ($curtot1/100)*$dispercent;
$tamt = $curtot1 - $disamt1;
$taxamt = ($tamt/100)*$tax;
$totalamt = $tamt + $taxamt;
$prod_whole_price = $totalamt;
$subtotal += $prod_whole_price;
$shippingcost=$sectagdetail2[0]['sc'];
$gtot=$subtotal+$shippingcost;

        $html .= '
        <tr>
            <td style="width: 6%;border: 1px solid #ddd;line-height:20px;">' .$sno. '</td>
            <td style="width: 55%;border: 1px solid #ddd;line-height:20px;">' . $purchase['product_name'] . '</td>
            <td style="width:16%;border: 1px solid #ddd;line-height:20px;">'. $purchase['quantity'] . ' X ' . number_format($prod_price, 2). '</td>
             <td style="width:9%;text-align:right;border: 1px solid #ddd;line-height:20px;">' .$totaltax. '%</td>
              <td style="width:14%;text-align:right;border: 1px solid #ddd;line-height:20px;">' .$dispercents. '%</td>
            <td style="width:15%;text-align:right;border: 1px solid #ddd;line-height:20px;">' . number_format($prod_whole_price,2) . '</td>
         </tr>';
    }
 
    $html .= '
            </tbody>
        </table>
 <table style=" border-collapse: collapse;width: 100%;font-size:10px;padding:10px 0 0 0;">
<tr style="padding-top: 1px;text-align:right;line-height:10px;">
<td></td>
<td></td>
<td></td>
<td style="text-align:right;font-size:9px;line-height:15px;"><span>Subtotal ₹ :</span> <span><b>' . number_format($subtotal ,2) . '</b></span><br>
<span>Shipping Cost ₹ :</span> <span><b>' . number_format($shippingcost, 2) . '</b></span><br>
<span>Grand Total ₹ :</span> <span><b>' . round($gtot) . '</b></span><br></td>
        </tr>
        </table>
 ';
    // Output the content
    $pdf->writeHTML($html, true, false, true, false, '');
    // ===== 🔧 KEY CHANGE STARTS HERE =====

    $folder = FCPATH . 'uploads/invoices/';   // ✅ CORRECT PATH

    if (!is_dir($folder)) {
        mkdir($folder, 0755, true);
    }
    // Save PDF (IMPORTANT)
        $file_name = 'Invoice_'.$ordnum.'.pdf';
        $file_path = $folder.$file_name;

    $pdf->Output($file_path, 'F'); // SAVE FILE

    ob_end_clean();

    // Return public URL for WhatsApp
    return base_url('uploads/invoices/'.$file_name);
}
	
	
	
	
	
	
	
	
	public function send_whatsapp_invoice($order_no)
{
    $pdf_url = $this->generate_pdf_whatsapp($order_no);
    if (!$pdf_url) die('PDF failed');

    $order = $this->db->where('order_number', $order_no)
                      ->get('db_shipping_address')
                      ->row_array();
    if (!$order) die('Order not found');

    $mobile = '91'.trim($order['mobilephone']);

    // 🔴 GET THIS FROM WACTO DASHBOARD
    $phone_number_id = "919092903311";

    $api_url = "https://api.wacto.app/api/v1.0/messages/send-template/".$phone_number_id;
    $api_key = "MaUFwvHGaUW21B7MFllDqg";

    $payload = [
        "messaging_product" => "whatsapp",
        "to" => $mobile,
        "type" => "template",
        "template" => [
            "name" => "invoiceorderdetailpdf1",
            "language" => ["code" => "en"],
            "components" => [
                [
                    "type" => "header",
                    "parameters" => [[
                        "type" => "document",
                        "document" => [
                            "link" => $pdf_url,
                            "filename" => "Invoice_".$order_no.".pdf"
                        ]
                    ]]
                ],
                [
                    "type" => "body",
                    "parameters" => [[
                        "type" => "text",
                        "text" => $order['firstname']
                    ]]
                ]
            ]
        ]
    ];

    $ch = curl_init($api_url);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer ".$api_key,
            "Content-Type: application/json"
        ],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_RETURNTRANSFER => true
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

   echo "<script>alert('Invoice sent via WhatsApp');window.close();</script>";
}

	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	public function send_whatsapp_disinvoice($order_number)
{
    
 
    // 1. Fetch order & user details
    $order = $this->mo_sqlz->rowSelectArray('db_shipping_address', 'order_number', $order_number);
    

    $user_id = $order[0]['user_id'];
    $user    = $this->mo_sqlz->rowSelectArray('db_signup', 'id', $user_id);

    $delivery = $this->mo_sqlz->rowSelectArray('db_delivery_details', 'order_number', $order_number);

    // 2. WhatsApp number (with country code)
     $phone = '91' . $order[0]['mobilephone'];  

    // 3. Prepare template variables (map properly)
     
 	$selproductname = "SELECT * FROM db_cart WHERE `status`='1' AND `order_number`='".$order_number."'";	
		$selproductnameExe = $this->db->query($selproductname);
		$productname = $selproductnameExe->result_array();

    $bodyParams = [
        $order[0]['firstname'],                   //name              
        $delivery[0]['order_number'],             //order number   
        $productname[0]['product_name'],          //product name            
        $delivery[0]['order_packaged_details'],   //Package Details   
        $delivery[0]['order_shipped_details'],    //Shipped Date 
        $delivery[0]['order_delivered_details'],  //Courier Name   
        $delivery[0]['deliverychallannumber'],    //Courier Challan Number         
        $delivery[0]['delivery_date'],            //Courier Date 
        $delivery[0]['Trackinglink']
     ]; 

    // 4. Send WhatsApp
    $response = $this->send_wacto_whatsapp($phone, $bodyParams);

    // 5. Update status
if ($response['status'] === true) {

    $this->db->where('delivery_id', $delivery[0]['delivery_id']);
    $this->db->update('db_delivery_details', [
        'sms_status' => '1'
    ]);

    // Always show success (do NOT rely on affected_rows)
    $this->session->set_flashdata(
        'success',
        'WhatsApp Message sent successfully'
    );

} else {

    $this->session->set_flashdata(
        'error',
        'WhatsApp failed'
    );
}

redirect('admin/order/delivery_details/' . $order_number);


 
}



private function send_wacto_whatsapp($phone, $params)
{
    $phone_number_id = "919092903311";
    $url = "https://api.wacto.app/api/v1.0/messages/send-template/" . $phone_number_id;
    $token = "MaUFwvHGaUW21B7MFllDqg";

    $components = [];
    foreach ($params as $value) {
        $components[] = [
            "type" => "text",
            "text" => (string)$value
        ];
    }

    $payload = [
        "messaging_product" => "whatsapp",
        "recipient_type" => "individual",
        "to" => $phone,
        "type" => "template",
        "template" => [
            "name" => "productdispatch",
            "language" => ["code" => "en"],
            "components" => [
                [
                    "type" => "body",
                    "parameters" => $components
                ]
            ]
        ]
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "Authorization: Bearer " . $token
        ],
        CURLOPT_TIMEOUT => 30
    ]);

    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'status'   => in_array($httpCode, [200, 201]),
        'response' => $result
    ];
}

 
	
	
	
	
	
	
	
	
	
	
	function actions()
	{
		if($this->input->post('search') == 'Search')
		{
			$data['s'] = 1;
			$this->load->view("admin/includes/header");
			$search_fields = array('order_number','created_date');
			$data['query'] = $this->mo_admin_common->search('id',$search_fields);
			$this->load->view('admin/'.$this->folder_path.'/list',$data);
			$this->load->view("admin/includes/footer");
		}
		if($this->input->post('publish_x'))
		{
			$data_to_store = array('status' => '1');
			$this->mo_sqlz->update($this->table,'order_number',$this->input->post("del_id"),$data_to_store);
			$this->session->set_flashdata('message', $this->list_name.' published successfully');
			redirect($this->config->item('admin_path').$this->folder_path);
		}
		if($this->input->post('unpublish_x'))
		{
			$data_to_store = array('status' => '0');
			$this->mo_sqlz->update($this->table,'order_number',$this->input->post("del_id"),$data_to_store);
			$this->session->set_flashdata('message', $this->list_name.' blocked successfully');
			redirect($this->config->item('admin_path').$this->folder_path);
		}
		if($this->input->post('trash_x'))
		{
			$data_to_store = array('status' => '2');
			$this->mo_sqlz->update($this->table,'order_number',$this->input->post("del_id"),$data_to_store);
			$this->session->set_flashdata('message', $this->list_name.' deleted successfully');
			redirect($this->config->item('admin_path').$this->folder_path);
		}
		if ($this->input->post('edit_x')) {
			$ids = $this->input->post('del_id');
			if (!empty($ids)) {
				$id = $ids[0];
				redirect($this->config->item('admin_path').$this->folder_path.'view/'.$id);
			} else {
				$this->session->set_flashdata('error', 'No item selected for editing.');
				redirect($this->config->item('admin_path').$this->folder_path);
			}
		}
	}
	
}